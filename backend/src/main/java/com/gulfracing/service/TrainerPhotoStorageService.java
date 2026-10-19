package com.gulfracing.service;

import com.gulfracing.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;

@Service
public class TrainerPhotoStorageService {
    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    private static final long MAX_IMAGE_PIXELS = 40_000_000L;
    private final Path photoDirectory;

    public TrainerPhotoStorageService(@Value("${app.upload-dir:uploads}") String uploadDirectory) {
        this.photoDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve("trainer-profiles");
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_FILE_BYTES) {
            throw ApiException.badRequest("Choose an image up to 5 MB.");
        }

        try {
            byte[] bytes = file.getBytes();
            String extension;
            byte[] normalizedImage;
            try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                if (input == null) throw ApiException.badRequest("The uploaded file is not a supported image.");
                Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) throw ApiException.badRequest("Only JPEG and PNG images are supported.");
                ImageReader reader = readers.next();
                try {
                    reader.setInput(input, true, true);
                    String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                    if (!format.equals("jpeg") && !format.equals("jpg") && !format.equals("png")) {
                        throw ApiException.badRequest("Only JPEG and PNG images are supported.");
                    }
                    int width = reader.getWidth(0);
                    int height = reader.getHeight(0);
                    if (width <= 0 || height <= 0 || (long) width * height > MAX_IMAGE_PIXELS) {
                        throw ApiException.badRequest("The image dimensions are too large.");
                    }
                    var image = reader.read(0);
                    if (image == null) throw ApiException.badRequest("The uploaded file is not a valid image.");
                    extension = format.equals("png") ? "png" : "jpg";
                    try (var output = new ByteArrayOutputStream()) {
                        if (!ImageIO.write(image, extension, output)) {
                            throw new IOException("No image encoder is available.");
                        }
                        normalizedImage = output.toByteArray();
                    }
                } finally {
                    reader.dispose();
                }
            }

            Files.createDirectories(photoDirectory);
            String fileName = UUID.randomUUID() + "." + extension;
            Path destination = photoDirectory.resolve(fileName).normalize();
            if (!destination.getParent().equals(photoDirectory)) throw new IOException("Invalid photo path.");
            Files.copy(new ByteArrayInputStream(normalizedImage), destination, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/trainer-profiles/" + fileName;
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to store trainer photo.", ex);
        }
    }
}
