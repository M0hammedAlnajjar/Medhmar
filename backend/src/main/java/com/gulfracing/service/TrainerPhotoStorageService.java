package com.gulfracing.service;

import com.gulfracing.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.util.Iterator;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.Semaphore;
import java.util.regex.Pattern;

@Service
public class TrainerPhotoStorageService {
    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    private static final long MAX_IMAGE_PIXELS = 16_000_000L;
    private static final int MAX_IMAGE_EDGE = 1024;
    private static final String URL_PREFIX = "/uploads/trainer-profiles/";
    private static final Pattern MANAGED_URL = Pattern.compile(
            "^/uploads/trainer-profiles/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(jpg|png)$");
    private final Semaphore encoders = new Semaphore(2);
    private final Path photoDirectory;

    public TrainerPhotoStorageService(@Value("${app.upload-dir:uploads}") String uploadDirectory) {
        this.photoDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize().resolve("trainer-profiles");
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() > MAX_FILE_BYTES) {
            throw ApiException.badRequest("Choose an image up to 5 MB.");
        }
        if (!encoders.tryAcquire()) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "UPLOAD_BUSY", "Image processing is busy. Try again shortly.");
        }

        try {
            byte[] bytes = file.getBytes();
            if (bytes.length > MAX_FILE_BYTES) throw ApiException.badRequest("Choose an image up to 5 MB.");
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
                    image = resize(image);
                    extension = format.equals("png") ? "png" : "jpg";
                    try (var output = new ByteArrayOutputStream()) {
                        if (!ImageIO.write(image, extension, output)) {
                            throw new IOException("No image encoder is available.");
                        }
                        normalizedImage = output.toByteArray();
                        if (normalizedImage.length > MAX_FILE_BYTES) {
                            throw ApiException.badRequest("The processed image exceeds 5 MB.");
                        }
                    }
                } finally {
                    reader.dispose();
                }
            }

            Files.createDirectories(photoDirectory);
            String fileName = UUID.randomUUID() + "." + extension;
            Path destination = photoDirectory.resolve(fileName).normalize();
            if (!destination.getParent().equals(photoDirectory)) throw new IOException("Invalid photo path.");
            Path staging = Files.createTempFile(photoDirectory, "upload-", ".tmp");
            try {
                Files.write(staging, normalizedImage);
                Files.move(staging, destination);
            } finally {
                Files.deleteIfExists(staging);
            }
            return URL_PREFIX + fileName;
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to store trainer photo.", ex);
        } finally {
            encoders.release();
        }
    }

    public boolean isManagedUrl(String url) {
        return url != null && MANAGED_URL.matcher(url).matches();
    }

    // Only server-generated UUID names in this directory may be removed.
    public void deleteManaged(String url) throws IOException {
        if (!isManagedUrl(url)) return;
        Path destination = photoDirectory.resolve(url.substring(URL_PREFIX.length())).normalize();
        if (!photoDirectory.equals(destination.getParent())) throw new IOException("Invalid photo path.");
        Files.deleteIfExists(destination);
    }

    private BufferedImage resize(BufferedImage source) {
        int width = source.getWidth();
        int height = source.getHeight();
        if (Math.max(width, height) <= MAX_IMAGE_EDGE) return source;
        double scale = (double) MAX_IMAGE_EDGE / Math.max(width, height);
        var resized = new BufferedImage(Math.max(1, (int) (width * scale)), Math.max(1, (int) (height * scale)),
                source.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
        var graphics = resized.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            graphics.drawImage(source, 0, 0, resized.getWidth(), resized.getHeight(), null);
        } finally {
            graphics.dispose();
        }
        return resized;
    }
}
