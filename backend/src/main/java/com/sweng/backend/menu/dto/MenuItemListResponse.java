package com.sweng.backend.menu.dto;

import java.util.List;

/** Response wrapper containing menu items for a restaurant. */
public class MenuItemListResponse {

  private List<MenuItemDto> data;

  /** Default constructor for serialization. */
  public MenuItemListResponse() {}

  /**
   * Constructs a response with menu item data.
   *
   * @param data the list of menu items
   */
  public MenuItemListResponse(List<MenuItemDto> data) {
    this.data = data;
  }

  /**
   * Gets the menu item list.
   *
   * @return the menu item list
   */
  public List<MenuItemDto> getData() {
    return data;
  }

  /**
   * Sets the menu item list.
   *
   * @param data the menu item list to set
   */
  public void setData(List<MenuItemDto> data) {
    this.data = data;
  }
}