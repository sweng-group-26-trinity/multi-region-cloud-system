package com.sweng.backend.storage;

import java.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for file upload endpoints. Accepts multipart file uploads and stores them in
 * Google Cloud Storage.
 */
@RestController
@RequestMapping("/api/upload")
public class StorageController {

  private final StorageService storageService;

  /**
   * Constructs a StorageController with the given storage service.
   *
   * @param storageService the GCS storage service
   */
  public StorageController(StorageService storageService) {
    this.storageService = storageService;
  }

  /**
   * Uploads an image to GCS and returns its public URL. The URL can then be stored in the database
   * as the imageUrl field for a restaurant or menu item.
   *
   * <p>Example usage:
   *
   * <pre>
   *   POST /api/upload/image?folder=restaurants
   *   Content-Type: multipart/form-data
   *   Body: file=@Burger.webp
   * </pre>
   *
   * @param file the image file to upload
   * @param folder optional GCS folder prefix, defaults to "images"
   * @return a JSON object containing the public URL of the uploaded image
   * @throws IOException if the file cannot be read
   */
  @PostMapping("/image")
  public ResponseEntity<UploadResponse> uploadImage(
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "folder", defaultValue = "images") String folder)
      throws IOException {
    String url = storageService.upload(file, folder);
    return ResponseEntity.ok(new UploadResponse(url));
  }

  /**
   * Response body for upload endpoints.
   *
   * @param url the public GCS URL of the uploaded file
   */
  public record UploadResponse(String url) {}
}
