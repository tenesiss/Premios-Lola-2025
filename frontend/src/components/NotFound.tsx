import { Link } from "react-router-dom";
import Brand from "./Brand";
import Icon from "./Icon";

export default function NotFound() {
  return (
    <main className="not-found">
      <Brand />
      <strong>404</strong>
      <h1>Fuera de esta línea de tiempo.</h1>
      <p>Este destino no existe. Tu próxima historia te espera en el inicio.</p>
      <Link className="button button-primary" to="/">
        Volver al presente <Icon name="arrow-right" />
      </Link>
    </main>
  );
}
