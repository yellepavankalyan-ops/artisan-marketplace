import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <section className="panel narrow">
      <p className="eyebrow">Access denied</p>
      <h1>This account cannot open that page.</h1>
      <p className="muted">Login with the right role to continue.</p>
      <Link className="button primary" to="/">
        Back to marketplace
      </Link>
    </section>
  );
}

export default Unauthorized;
