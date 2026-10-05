import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Vote } from "../types/api";
import Icon from "./Icon";

interface Props {
  movies: Vote[];
  server: string;
  hasVoted: boolean;
  votedId: number | null;
  submitting?: boolean;
  onSelect: (movie: Vote) => void;
}

function MovieArtwork({
  movie,
  server,
  index,
}: {
  movie: Vote;
  server: string;
  index: number;
}) {
  const [failed, setFailed] = useState(false);
  const src = movie.logo ? `${server}/${movie.logo.replace(/^\//, "")}` : "";
  return (
    <div className="movie-artwork">
      {src && !failed ? (
        <img
          src={src}
          alt={`Afiche de ${movie.name}`}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="poster-fallback" aria-hidden="true">
          <span className="poster-number">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}

export default function VoteCarousel({
  movies,
  server,
  hasVoted,
  votedId,
  submitting = false,
  onSelect,
}: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    start: 0,
    end: 0,
    atStart: true,
    atEnd: true,
  });
  const updatePosition = useCallback(() => {
    const element = track.current;
    if (!element) return;
    const cards = Array.from(element.children) as HTMLElement[];
    const left = element.getBoundingClientRect().left;
    const visible = cards
      .map((card, index) => ({ index, rect: card.getBoundingClientRect() }))
      .filter(
        ({ rect }) =>
          rect.right > left + 8 && rect.left < left + element.clientWidth - 8,
      );
    setPosition({
      start: visible[0]?.index ?? 0,
      end: visible.at(-1)?.index ?? 0,
      atStart: element.scrollLeft <= 3,
      atEnd:
        element.scrollLeft + element.clientWidth >= element.scrollWidth - 3,
    });
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(element);
    return () => observer.disconnect();
  }, [movies.length, updatePosition]);

  const move = (direction: -1 | 1) => {
    const element = track.current;
    if (!element) return;
    const firstCard = element.firstElementChild as HTMLElement | null;
    const distance =
      (firstCard?.getBoundingClientRect().width ?? element.clientWidth) +
      parseFloat(getComputedStyle(element).columnGap || "0");
    element.scrollBy({
      left: direction * distance,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      move(event.key === "ArrowRight" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const element = track.current;
      element?.scrollTo({
        left: event.key === "Home" ? 0 : element.scrollWidth,
        behavior: "instant",
      });
    }
  };

  return (
    <div
      className="voting-carousel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Propuestas para votar"
    >
      <div className="carousel-toolbar">
        <span>
          {movies.length} {movies.length === 1 ? "propuesta" : "propuestas"}
        </span>
      </div>
      <div
        className="carousel-track"
        id="proposals-carousel"
        ref={track}
        onScroll={updatePosition}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="Usá las flechas del teclado o deslizá para explorar las propuestas"
      >
        {movies.map((movie, index) => (
          <article
            className={`movie-entry ${votedId === movie.ID ? "movie-voted" : ""}`}
            key={movie.ID}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${movies.length}: ${movie.name}`}
          >
            <MovieArtwork
              key={`${movie.ID}-${movie.logo}`}
              movie={movie}
              server={server}
              index={index}
            />
            <div className="movie-details">
              <span className="movie-school">{movie.school}</span>
              <h3>{movie.name}</h3>
              <button
                className="vote-link"
                disabled={hasVoted || submitting}
                onClick={() => onSelect(movie)}
                aria-label={
                  hasVoted
                    ? `${movie.name}: tu voto ya está registrado`
                    : `Votar por ${movie.name}`
                }
              >
                <span>
                  {votedId === movie.ID
                    ? "Tu voto"
                    : hasVoted
                      ? "Voto registrado"
                      : "Votar"}
                </span>
                <Icon
                  name={
                    hasVoted || votedId === movie.ID ? "check" : "arrow-right"
                  }
                />
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="carousel-navigation">
        <p aria-live="polite" aria-atomic="true">
          <strong>
            {String(position.start + 1).padStart(2, "0")}
            {position.end > position.start
              ? ` — ${String(position.end + 1).padStart(2, "0")}`
              : ""}
          </strong>
          <span> / {String(movies.length).padStart(2, "0")}</span>
        </p>
        <div className="carousel-progress" aria-hidden="true">
          <span
            style={{
              width: `${((position.end - position.start + 1) / movies.length) * 100}%`,
              left: `${(position.start / movies.length) * 100}%`,
            }}
          />
        </div>
        <div className="carousel-arrows">
          <button
            onClick={() => move(-1)}
            disabled={position.atStart}
            aria-label="Propuesta anterior"
            aria-controls="proposals-carousel"
          >
            <Icon name="arrow-left" />
          </button>
          <button
            onClick={() => move(1)}
            disabled={position.atEnd}
            aria-label="Propuesta siguiente"
            aria-controls="proposals-carousel"
          >
            <Icon name="arrow-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
