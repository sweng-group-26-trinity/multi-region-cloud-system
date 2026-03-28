package com.sweng.backend.serverinfo.dto;

/**
 * DTO representing server information in API responses.
 *
 * <p>Matches the OpenAPI {@code ServerInfo} schema.
 */
public class ServerInfoDto {
  private String startTime;
  private String hostName;
  private String user;
  private String os;

  /** Default constructor for serialization. */
  public ServerInfoDto() {}

  /**
   * Gets the server start time
   *
   * @return the server start time
   */
  public String getStartTime() {
    return startTime;
  }

  /**
   * Sets the server start time
   *
   * @param startTime the server start time to set
   */
  public void setStartTime(String startTime) {
    this.startTime = startTime;
  }

  /**
   * Gets the host name
   *
   * @return the host name
   */
  public String getHostName() {
    return hostName;
  }

  /**
   * Sets the host name
   *
   * @param hostName the host name to set
   */
  public void setHostName(String hostName) {
    this.hostName = hostName;
  }

  /**
   * Gets the user
   *
   * @return the user
   */
  public String getUser() {
    return user;
  }

  /**
   * Sets the user
   *
   * @param user the user to set
   */
  public void setUser(String user) {
    this.user = user;
  }

  /**
   * Gets the operating system
   *
   * @return the operating system
   */
  public String getOs() {
    return os;
  }

  /**
   * Sets the operating system
   *
   * @param os the operating system to set
   */
  public void setOs(String os) {
    this.os = os;
  }
}
