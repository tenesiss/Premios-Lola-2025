import { useEffect, useRef } from "react";
import type { Vote } from "../types/api";

export default function VoteConfirmation({
  movie,
  submitting,
  canRevote,
  onCancel,
  onConfirm,
}: {
  movie: Vote;
  submitting: boolean;
  canRevote: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const section = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    heading.current?.focus({ preventScroll: true });
    section.current?.scrollIntoView({ behavior: "instant", block: "nearest" });
    return () => {
      if (previousFocus?.isConnected && !previousFocus.matches(":disabled")) {
        previousFocus.focus({ preventScroll: true });
      } else {
        document.getElementById("voting-title")?.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <section
      className="vote-confirmation"
      ref={section}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-description"
      aria-busy={submitting}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !submitting) {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <div className="confirmation-copy">
        <h3 id="confirm-title" ref={heading} tabIndex={-1}>
          Confirmar voto
        </h3>
        <p className="confirmation-choice">{movie.name}</p>
        <p className="confirmation-school">{movie.school}</p>
        <p id="confirm-description">
          {canRevote
            ? "Confirmá para registrar tu voto."
            : "Tu voto es único y no se puede cambiar."}
        </p>
      </div>
      <div className="confirmation-actions">
        <button
          className="button button-primary"
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="loader" /> Registrando…
            </>
          ) : (
            "Confirmar mi voto"
          )}
        </button>
        <button
          className="text-button"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </button>
      </div>
    </section>
  );
}
