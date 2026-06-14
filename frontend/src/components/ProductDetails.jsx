import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, money } from "../store/authStore.jsx";

const placeholder =
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=80";

function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    api(`/product-api/${id}`)
      .then((data) => setProduct(data.payload))
      .catch((error) => toast.error(error.message));
  }, [id]);

  function addToCart() {
    const current = JSON.parse(localStorage.getItem("artisan_cart") || "[]");
    const existing = current.find((item) => item.product === product._id);
    if (existing) existing.quantity += 1;
    else {
      current.push({
        product: product._id,
        artisan: product.artisan?._id,
        quantity: 1,
        price: product.price,
        title: product.title,
        imageUrl: product.images?.[0] || placeholder,
      });
    }
    localStorage.setItem("artisan_cart", JSON.stringify(current));
    toast.success("Added to cart");
  }

  if (!product) return <p className="empty">Loading product...</p>;

  return (
    <section className="detail-layout">
      <div className="gallery">
        <img src={product.images?.[0] || placeholder} alt={product.title} />
      </div>
      <article className="panel">
        <p className="eyebrow">{product.category}</p>
        <h1>{product.title}</h1>
        <p>{product.description}</p>
        <strong className="price">{money(product.price)}</strong>
        <div className="chip-row">
          <span className="chip">Stock {product.stock}</span>
          <span className="chip">{product.materials || "Handmade"}</span>
        </div>
        <button className="button primary" type="button" onClick={addToCart}>
          Add to cart
        </button>
        <Link className="button ghost" to="/cart">
          Checkout
        </Link>
      </article>
      <article className="panel wide">
        <p className="eyebrow">Artisan story</p>
        <h2>{product.artisan?.businessName || product.artisan?.firstName || "Maker profile"}</h2>
        <p className="muted">{product.artisan?.location}</p>
        <p>{product.artisan?.story || product.artisan?.bio || "This artisan has not added a story yet."}</p>
      </article>
    </section>
  );
}

export default ProductDetails;
