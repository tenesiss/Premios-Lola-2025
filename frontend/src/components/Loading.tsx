import Brand from "./Brand";

function LoadingScreen() {
  return (
    <div className="loading-screen" role="status">
      <Brand />
      <span className="loader" />
      <p>Conectando con otra línea de tiempo…</p>
    </div>
  );
}

export default LoadingScreen;
