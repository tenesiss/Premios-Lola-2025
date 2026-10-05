import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { User } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import { auth } from "../../firebase";
import googleIcon from "../assets/images/google.svg";
import type { ProposalResponse, UserStatus, Vote } from "../types/api";
import Icon from "./Icon";
import banner from "../assets/images/time-travel-banner-cartoon.png";
import VoteCarousel from "./VoteCarousel";
import VoteConfirmation from "./VoteConfirmation";

const server = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

async function getUserVoteStatus(token: string): Promise<UserStatus> {
  const response = await fetch(`${server}/user-vote-status`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error("No pudimos verificar tu voto. Volvé a intentarlo.");
  const status = await response.json();
  if (
    !status ||
    typeof status.hasVoted !== "boolean" ||
    !Array.isArray(status.repeatVoteGroups) ||
    !status.repeatVoteGroups.every(
      (group: unknown) => typeof group === "number" && Number.isSafeInteger(group) && group > 0,
    ) ||
    typeof status.canRepeatVoteAnyGroup !== "boolean"
  )
    throw new Error(
      "No pudimos cargar los permisos de votación. Actualizá la página y volvé a intentarlo.",
    );
  return status;
}

function areCookiesEnabled() {
  try {
    document.cookie = "lola_cookie_check=1; path=/; SameSite=Lax";
    const enabled = document.cookie.split("; ").includes("lola_cookie_check=1");
    document.cookie = "lola_cookie_check=; max-age=0; path=/; SameSite=Lax";
    return enabled;
  } catch {
    return false;
  }
}

export default function VotePanel() {
  const [movies, setMovies] = useState<Vote[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(auth));
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [repeatVoteGroups, setRepeatVoteGroups] = useState<number[]>([]);
  const [canRepeatVoteAnyGroup, setCanRepeatVoteAnyGroup] = useState(false);
  const [dataError, setDataError] = useState("");
  const [notice, setNotice] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const [selected, setSelected] = useState<Vote | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [votedId, setVotedId] = useState<number | null>(null);
  const requestVersion = useRef(0);
  const submittingRef = useRef(false);
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const parsedGroup = Number(groupId);
  const group =
    Number.isInteger(parsedGroup) && parsedGroup > 0 ? parsedGroup : 1;
  const canRevote =
    repeatVoteGroups.includes(group) || canRepeatVoteAnyGroup;
  const groupMovies = movies.filter((movie) => Number(movie.group) === group);
  const groups = [
    ...new Set([
      1,
      2,
      3,
      4,
      group,
      ...movies.map((movie) => Number(movie.group)),
    ]),
  ].sort((a, b) => a - b);

  const loadMovies = useCallback(async (currentUser: User) => {
    const version = ++requestVersion.current;
    setMoviesLoading(true);
    setDataError("");
    try {
      if (!server)
        throw new Error(
          "La conexión con las propuestas no está disponible. Intentá nuevamente más tarde.",
        );
      const token = await currentUser.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [proposalsResponse, status] = await Promise.all([
        fetch(`${server}/proposals`, { headers }),
        getUserVoteStatus(token),
      ]);
      if (!proposalsResponse.ok)
        throw new Error(
          "No pudimos cargar las propuestas. Volvé a intentarlo.",
        );
      const proposals: Vote[] = await proposalsResponse.json();
      if (version !== requestVersion.current) return;
      setMovies(proposals);
      setHasVoted(status.hasVoted);
      setRepeatVoteGroups(status.repeatVoteGroups);
      setCanRepeatVoteAnyGroup(status.canRepeatVoteAnyGroup);
    } catch (error) {
      if (version === requestVersion.current)
        setDataError(
          error instanceof Error
            ? error.message
            : "No pudimos cargar las propuestas.",
        );
    } finally {
      if (version === requestVersion.current) setMoviesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      requestVersion.current += 1;
      setUser(currentUser);
      setAuthLoading(false);
      setHasVoted(false);
      setRepeatVoteGroups([]);
      setCanRepeatVoteAnyGroup(false);
      setVotedId(null);
      setSelected(null);
      setMovies([]);
      setNotice(null);
      setDataError("");
      if (currentUser) void loadMovies(currentUser);
      else setMoviesLoading(false);
    });
    return () => {
      unsubscribe();
      requestVersion.current += 1;
    };
  }, [loadMovies]);

  const handleLogin = async () => {
    setNotice(null);
    if (!auth) {
      setNotice({
        text: "El inicio de sesión no está disponible en este momento. Intentá más tarde o consultá a la organización.",
        error: true,
      });
      document
        .getElementById("votacion")
        ?.scrollIntoView({ behavior: "instant" });
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        setNotice({
          text:
            code === "auth/popup-blocked"
              ? "Permití las ventanas emergentes para iniciar sesión con Google."
              : "No pudimos iniciar sesión. Volvé a intentarlo.",
          error: true,
        });
        document
          .getElementById("votacion")
          ?.scrollIntoView({ behavior: "instant" });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch {
      setNotice({
        text: "No pudimos cerrar la sesión. Volvé a intentarlo.",
        error: true,
      });
    }
  };

  const handleVote = async () => {
    if (!user || !selected || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setNotice(null);
    try {
      if (!areCookiesEnabled())
        throw new Error(
          "Habilitá las cookies de tu navegador para poder votar.",
        );
      const token = await user.getIdToken();
      const status = await getUserVoteStatus(token);
      setHasVoted(status.hasVoted);
      setRepeatVoteGroups(status.repeatVoteGroups);
      setCanRepeatVoteAnyGroup(status.canRepeatVoteAnyGroup);
      const canRepeatSelectedVote =
        status.repeatVoteGroups.includes(Number(selected.group)) ||
        status.canRepeatVoteAnyGroup;
      if (status.hasVoted && !canRepeatSelectedVote)
        throw new Error("Tu voto ya está registrado. ¡Gracias por participar!");
      const response = await fetch(`${server}/votes/${selected.ID}`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.uid }),
      });
      const data: ProposalResponse & { error?: string } = await response.json();
      if (!response.ok || data.error)
        throw new Error(
          data.error?.includes("deshabilitada")
            ? "La votación de este grupo todavía no está habilitada. Esperá la indicación de la organización."
            : "No se pudo registrar tu voto. Intentá nuevamente o consultá a la organización.",
        );
      setHasVoted(true);
      setVotedId(selected.ID);
      setNotice({
        text: `Tu voto por “${selected.name}” quedó registrado. ¡Gracias por participar!`,
      });
    } catch (error) {
      setNotice({
        text:
          error instanceof Error
            ? error.message
            : "No pudimos registrar tu voto.",
        error: true,
      });
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setSelected(null);
    }
  };

  return (
    <main className="voting-app">
      <a className="skip-link" href="#votacion">
        Ir a la votación
      </a>
      <header className="time-banner">
        <img
          className="time-banner-image"
          src={banner}
          alt="Ilustración de un portal azul con engranajes de reloj y un túnel del tiempo"
          fetchPriority="high"
        />
        <div className="time-banner-copy">
          <p>Un viaje en el tiempo</p>
          <h1>
            Premios Lola <span>2025</span>
          </h1>
        </div>
      </header>
      <section
        className="voting-section"
        id="votacion"
        aria-labelledby="voting-title"
      >
        <div className="voting-heading">
          <div>
            <h2 id="voting-title" tabIndex={-1}>
              Elegí tu favorita
            </h2>
            <p>Deslizá las propuestas y emití tu voto.</p>
          </div>
          <div className="voting-controls">
            <label className="group-select">
              <span className="sr-only">Grupo de votación</span>
              <select
                aria-label="Grupo de votación"
                value={group}
                disabled={submitting}
                onChange={(event) => {
                  setSelected(null);
                  setNotice(null);
                  navigate(`/group/${event.target.value}#votacion`);
                }}
              >
                {groups.map((number) => (
                  <option key={number} value={number}>
                    Grupo {String(number).padStart(2, "0")}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" />
            </label>
            {user && (
              <button
                className="account-button"
                onClick={handleLogout}
                title="Cerrar sesión"
                disabled={submitting}
              >
                <span>Cerrar sesión</span>
                <Icon name="logout" />
              </button>
            )}
          </div>
        </div>
        {notice && (
          <div
            className={`notice ${notice.error ? "notice-error" : "notice-success"}`}
            role={notice.error ? "alert" : "status"}
          >
            <Icon name={notice.error ? "info" : "check"} />
            <p>{notice.text}</p>
            <button aria-label="Cerrar mensaje" onClick={() => setNotice(null)}>
              <Icon name="close" />
            </button>
          </div>
        )}
        {selected && (
          <VoteConfirmation
            key={selected.ID}
            movie={selected}
            submitting={submitting}
            canRevote={canRevote}
            onCancel={() => setSelected(null)}
            onConfirm={handleVote}
          />
        )}
        {authLoading || moviesLoading ? (
          <div className="carousel-loading" role="status">
            <span className="loader" />
            <p>Cargando propuestas…</p>
          </div>
        ) : !user ? (
          <div className="vote-signin">
            <h3>Iniciá sesión para votar</h3>
            <p>Ingresá con Google para ver las propuestas de tu grupo.</p>
            <button
              className="button button-google"
              onClick={handleLogin}
              disabled={loginLoading}
            >
              <img src={googleIcon} alt="" />
              {loginLoading ? "Conectando con Google…" : "Continuar con Google"}
            </button>
          </div>
        ) : dataError ? (
          <div className="empty-state" role="alert">
            <Icon name="info" />
            <h3>No pudimos cargar las propuestas.</h3>
            <p>{dataError}</p>
            <button
              className="button button-primary"
              onClick={() => loadMovies(user)}
            >
              Volver a intentar <Icon name="refresh" />
            </button>
          </div>
        ) : groupMovies.length === 0 ? (
          <div className="empty-state">
            <Icon name="film" />
            <h3>Todavía no hay propuestas.</h3>
            <p>
              Todavía no hay propuestas en el grupo {group}. Podés explorar otro
              grupo o volver a consultar.
            </p>
            <button
              className="button button-outline"
              onClick={() => loadMovies(user)}
            >
              Actualizar propuestas <Icon name="refresh" />
            </button>
          </div>
        ) : (
          <>
            {hasVoted && !canRevote && !notice && (
              <div className="notice notice-success" role="status">
                <Icon name="check" />
                <p>Tu voto ya está registrado. ¡Gracias por participar!</p>
              </div>
            )}
            <VoteCarousel
              key={group}
              movies={groupMovies}
              server={server}
              hasVoted={hasVoted && !canRevote}
              votedId={votedId}
              submitting={submitting}
              onSelect={setSelected}
            />
          </>
        )}
      </section>
    </main>
  );
}
