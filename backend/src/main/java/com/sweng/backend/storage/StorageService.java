package com.sweng.backend.storage;

import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.Storage;
import java.io.IOException;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service for uploading files to Google Cloud Storage. Uploaded files are made publicly readable
 * and their public URL is returned.
 */
@Service
public class StorageService {

  private final Storage storage;

  @Value("${gcs.bucket-name}")
  private String bucketName;

  @Value("${gcs.emulator-url:#{null}}")
  private String emulatorUrl;

  /**
   * Optional override for the public-facing base URL of uploaded objects. Used in local dev to
   * route image requests through the Bun dev server proxy instead of directly to the GCS emulator
   * (which has a self-signed cert the browser rejects).
   *
   * <p>Example: {@code http://localhost:3000/gcs}
   *
   * <p>If not set, falls back to {@code emulatorUrl} for local dev, or the real GCS URL for
   * production.
   */
  @Value("${gcs.public-url:#{null}}")
  private String publicUrl;

  /**
   * Constructs a StorageService with the GCS client.
   *
   * @param storage the GCS Storage client
   */
  public StorageService(Storage storage) {
    this.storage = storage;
  }

  /**
   * Uploads a file to GCS under the given folder and returns its public URL. The file is stored
   * with a random UUID filename to avoid collisions.
   *
   * @param file the file to upload
   * @param folder the GCS folder prefix (e.g. "restaurants" or "menu")
   * @return the public HTTPS URL of the uploaded file
   * @throws IOException if the file cannot be read
   * @throws IllegalArgumentException if the file is empty
   */
  public String upload(MultipartFile file, String folder) throws IOException {
    if (file.isEmpty()) {
      throw new IllegalArgumentException("File must not be empty");
    }

    String extension = getExtension(file.getOriginalFilename());
    String objectName = folder + "/" + UUID.randomUUID() + extension;

    BlobId blobId = BlobId.of(bucketName, objectName);
    BlobInfo blobInfo = BlobInfo.newBuilder(blobId).setContentType(file.getContentType()).build();

    storage.createFrom(
        blobInfo,
        file.getInputStream(),
        Storage.BlobWriteOption.predefinedAcl(Storage.PredefinedAcl.PUBLIC_READ));

    if (emulatorUrl != null) {
      String base = publicUrl != null ? publicUrl : emulatorUrl;
      return String.format(
          "%s/download/storage/v1/b/%s/o/%s?alt=media",
          base, bucketName, objectName.replace("/", "%2F"));
    }

    return String.format("https://storage.googleapis.com/%s/%s", bucketName, objectName);
  }

  /**
   * Extracts the file extension from a filename.
   *
   * @param filename the original filename
   * @return the extension including the dot (e.g. ".webp"), or empty string if none
   */
  private String getExtension(String filename) {
    if (filename == null || !filename.contains(".")) {
      return "";
    }
    return filename.substring(filename.lastIndexOf("."));
  }
}
