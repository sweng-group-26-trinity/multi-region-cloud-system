package com.sweng.backend.highscore;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository interface for accessing and managing {@link Highscore} entities.
 *
 * <p>Extends {@link JpaRepository} to provide standard CRUD operations, along with custom query
 * methods for leaderboard functionality.
 */
public interface HighscoreRepository extends JpaRepository<Highscore, Long> {

  /**
   * Finds a high score by username.
   *
   * @param username the username to search for
   * @return an {@link Optional} containing the high score if found, otherwise empty
   */
  Optional<Highscore> findByUsername(String username);

  /**
   * Retrieves the top 10 high scores ordered by score in descending order.
   *
   * @return a list of the top 10 high scores
   */
  List<Highscore> findTop10ByOrderByScoreDesc();

  /**
   * Retrieves all high scores ordered by score in descending order.
   *
   * @return a list of all high scores sorted from highest to lowest
   */
  List<Highscore> findAllByOrderByScoreDesc();
}
