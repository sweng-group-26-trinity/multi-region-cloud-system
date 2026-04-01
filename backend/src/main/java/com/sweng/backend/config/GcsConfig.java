package com.sweng.backend.config;

import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.cloud.NoCredentials;
import com.google.cloud.http.HttpTransportOptions;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import java.io.IOException;
import java.security.cert.X509Certificate;
import javax.net.ssl.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration for the Google Cloud Storage client.
 *
 * <p>In production, the client uses Application Default Credentials — either {@code gcloud auth
 * application-default login} for local GCP development, or the attached service account when
 * running inside GCP.
 *
 * <p>In local development, when {@code gcs.emulator-url} is set in {@code application.yml}, the
 * client is pointed at a <a href="https://github.com/fsouza/fake-gcs-server">fake-gcs-server</a>
 * emulator instead. Because the emulator uses a self-signed TLS certificate, the transport layer is
 * configured to skip certificate validation. This is intentionally limited to the emulator path and
 * must never be used in production.
 */
@Configuration
public class GcsConfig {

  /**
   * Base URL of the local GCS emulator (e.g. {@code https://localhost:4443}). When {@code null},
   * the real GCS endpoint is used and Application Default Credentials are required.
   */
  @Value("${gcs.emulator-url:#{null}}")
  private String emulatorUrl;

  /**
   * GCP project ID used when constructing the Storage client. Must match the project configured in
   * the emulator or in GCP.
   */
  @Value("${gcs.project-id}")
  private String projectId;

  /**
   * Creates and configures the {@link Storage} bean.
   *
   * <p>When {@code gcs.emulator-url} is set the bean is configured with:
   *
   * <ul>
   *   <li>The emulator host as the storage endpoint.
   *   <li>{@link NoCredentials} so no GCP credentials are required.
   *   <li>A custom {@link HttpTransportOptions} that disables TLS certificate validation, allowing
   *       the client to communicate with the emulator's self-signed certificate.
   * </ul>
   *
   * @return a fully configured {@link Storage} client
   * @throws IOException if the underlying transport cannot be initialised
   */
  @Bean
  public Storage storage() throws IOException {
    StorageOptions.Builder builder = StorageOptions.newBuilder().setProjectId(projectId);

    if (emulatorUrl != null) {
      builder
          .setHost(emulatorUrl)
          .setCredentials(NoCredentials.getInstance())
          .setTransportOptions(
              HttpTransportOptions.newBuilder()
                  .setHttpTransportFactory(
                      () -> {
                        try {
                          SSLContext sc = SSLContext.getInstance("TLS");
                          sc.init(
                              null,
                              new TrustManager[] {
                                new X509TrustManager() {
                                  /** Returns {@code null} — all issuers are accepted. */
                                  public X509Certificate[] getAcceptedIssuers() {
                                    return null;
                                  }

                                  /** No-op — client certificates are not validated. */
                                  public void checkClientTrusted(X509Certificate[] c, String a) {}

                                  /** No-op — server certificates are not validated. */
                                  public void checkServerTrusted(X509Certificate[] c, String a) {}
                                }
                              },
                              new java.security.SecureRandom());
                          HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
                          HttpsURLConnection.setDefaultHostnameVerifier((h, s) -> true);
                          return new NetHttpTransport.Builder().doNotValidateCertificate().build();
                        } catch (Exception e) {
                          throw new RuntimeException(e);
                        }
                      })
                  .build());
    }

    return builder.build().getService();
  }
}
