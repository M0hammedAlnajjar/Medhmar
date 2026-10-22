package com.gulfracing.integration;

import com.gulfracing.dto.UserDtos.UpdateProfileRequest;
import com.gulfracing.exception.ApiException;
import com.gulfracing.service.TrainerProfileService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.Comparator;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TrainerPhotoLifecycleIntegrationTests extends IntegrationSupport {
    private static final Path UPLOADS = tempDirectory();
    @Autowired TrainerProfileService profiles;
    @Autowired PlatformTransactionManager transactions;

    @DynamicPropertySource
    static void uploads(DynamicPropertyRegistry registry) {
        registry.add("app.upload-dir", UPLOADS::toString);
    }

    @BeforeEach
    void removeTestPhotos() throws IOException {
        if (Files.exists(UPLOADS)) {
            try (var paths = Files.walk(UPLOADS)) {
                for (var path : paths.filter(Files::isRegularFile).toList()) Files.delete(path);
            }
        }
    }

    @AfterAll
    static void removeDirectory() throws IOException {
        try (var paths = Files.walk(UPLOADS)) {
            for (var path : paths.sorted(Comparator.reverseOrder()).toList()) Files.delete(path);
        }
    }

    @Test
    void repeatedHttpUploadsRetainOnlyCurrentBoundedImage() throws Exception {
        var trainer = register("photos@example.com", "TRAINER");
        profiles.create(trainer.userId(), "Trainer", "Muscat");
        var session = login(trainer.email());
        String url = null;
        for (int i = 0; i < 3; i++) {
            url = mvc.perform(multipart("/trainer-profile/photo").file(photo(2048, 512))
                    .session(session).with(csrf())).andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            assertThat(fileCount()).isEqualTo(1);
        }
        assertThat(users.me(trainer.userId()).avatarUrl()).isEqualTo(url);
        var image = ImageIO.read(file(url).toFile());
        assertThat(image.getWidth()).isEqualTo(1024);
        assertThat(image.getHeight()).isEqualTo(256);
        assertThat(Files.size(file(url))).isLessThanOrEqualTo(5L * 1024 * 1024);
    }

    @Test
    void rollbackDeletesNewFileAndPreservesCommittedImage() throws Exception {
        var trainer = register("rollback@example.com", "TRAINER");
        profiles.create(trainer.userId(), "Trainer", "Muscat");
        String original = profiles.uploadPhoto(trainer.userId(), photo(16, 16));
        var replacement = new AtomicReference<String>();
        var image = photo(32, 32);
        new TransactionTemplate(transactions).executeWithoutResult(tx -> {
            replacement.set(profiles.uploadPhoto(trainer.userId(), image));
            assertThat(file(original)).exists();
            tx.setRollbackOnly();
        });
        assertThat(file(original)).exists();
        assertThat(file(replacement.get())).doesNotExist();
        assertThat(users.me(trainer.userId()).avatarUrl()).isEqualTo(original);
        assertThat(fileCount()).isEqualTo(1);
    }

    @Test
    void profileEditCleansItsOwnOldPhotoAndCannotAdoptAnotherUsersManagedFile() throws Exception {
        var owner = register("image-owner@example.com", "TRAINER");
        var other = register("image-other@example.com");
        profiles.create(owner.userId(), "Trainer", "Muscat");
        String url = profiles.uploadPhoto(owner.userId(), photo(16, 16));
        assertThatThrownBy(() -> users.updateProfile(other.userId(), new UpdateProfileRequest("Other", "en", url)))
                .isInstanceOf(ApiException.class);
        assertThat(file(url)).exists();
        users.updateProfile(owner.userId(), new UpdateProfileRequest("Owner", "en", "https://example.test/photo.png"));
        assertThat(file(url)).doesNotExist();
    }

    @Test
    void concurrentUploadsLeaveOneCommittedImage() throws Exception {
        var trainer = register("concurrent-photo@example.com", "TRAINER");
        profiles.create(trainer.userId(), "Trainer", "Muscat");
        var image = photo(32, 32);
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<String> upload = () -> { start.await(); return profiles.uploadPhoto(trainer.userId(), image); };
            var first = executor.submit(upload);
            var second = executor.submit(upload);
            start.countDown();
            first.get(10, TimeUnit.SECONDS);
            second.get(10, TimeUnit.SECONDS);
        }
        assertThat(fileCount()).isEqualTo(1);
        assertThat(file(users.me(trainer.userId()).avatarUrl())).exists();
    }

    private static MockMultipartFile photo(int width, int height) throws IOException {
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "png", bytes);
        return new MockMultipartFile("photo", "profile.png", "image/png", bytes.toByteArray());
    }

    private static Path file(String url) { return UPLOADS.resolve(url.substring("/uploads/".length())); }
    private static long fileCount() throws IOException {
        try (var files = Files.list(UPLOADS.resolve("trainer-profiles"))) { return files.count(); }
    }
    private static Path tempDirectory() {
        try { return Files.createTempDirectory("medhmar-photo-test-"); }
        catch (IOException failure) { throw new UncheckedIOException(failure); }
    }
}
