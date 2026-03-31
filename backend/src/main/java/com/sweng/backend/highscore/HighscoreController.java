package com.sweng.backend.highscore;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing high scores.
 *
 * <p>Provides endpoints for submitting scores and retrieving leaderboard data.
 */
@RestController
@RequestMapping("/api/highscores")
public class HighscoreController {

  /** Repository used to access high score data. */
  private final HighscoreRepository repo;

  /**
   * Constructs the controller with the required repository.
   *
   * @param repo the high score repository
   */
  public HighscoreController(HighscoreRepository repo) {
    this.repo = repo;
  }

  /**
   * Request body for submitting a score.
   *
   * @param score the score to submit
   */
  public record ScoreRequest(int score) {}

  /**
   * Submits a score for the authenticated user.
   *
   * <p>If the user already has a score recorded, it will only be updated if the new score is higher
   * than the existing one. Otherwise, a new record is created.
   *
   * @param user the authenticated user
   * @param req the score submission request
   * @return the saved or updated high score
   */
  @PostMapping
  public ResponseEntity<Highscore> submit(
      @AuthenticationPrincipal UserDetails user, @RequestBody ScoreRequest req) {

    Highscore hs =
        repo.findByUsername(user.getUsername())
            .map(
                existing -> {
                  // Update only if the new score is higher
                  if (req.score() > existing.getScore()) {
                    existing.setScore(req.score());
                  }
                  return existing;
                })
            .orElseGet(() -> new Highscore(user.getUsername(), req.score()));

    return ResponseEntity.ok(repo.save(hs));
  }

  /**
   * Retrieves the top 10 high scores.
   *
   * <p>This endpoint is public and returns scores ordered in descending order.
   *
   * @return a list of the top 10 high scores
   */
  @GetMapping
  public List<Highscore> leaderboard() {
    return repo.findTop10ByOrderByScoreDesc();
  }

  /**
   * Retrieves all high scores.
   *
   * <p>Scores are returned in descending order.
   *
   * @return a list of all high scores
   */
  @GetMapping("/all")
  public List<Highscore> all() {
    return repo.findAllByOrderByScoreDesc();
  }
}
