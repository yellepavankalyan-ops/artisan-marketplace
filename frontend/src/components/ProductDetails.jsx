import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api, money } from "../store/authStore.jsx";

const categoryPlaceholders = {
  "Pottery": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
  "Textiles": "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80",
  "Jewelry": "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
  "Woodwork": "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80",
  "Painting": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
  "Metalwork": "https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=800&q=80",
  "Leather": "https://images.unsplash.com/photo-1524498250077-390f9e378db0?auto=format&fit=crop&w=800&q=80",
  "Bamboo & Cane": "https://images.unsplash.com/photo-1501747315-124a0eaca060?auto=format&fit=crop&w=800&q=80",
  "Embroidery": "https://images.unsplash.com/photo-1617050318658-a9a3175e34cb?auto=format&fit=crop&w=800&q=80",
  "Other": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80"
};

export function getProductImage(product) {
  if (product?.images && product.images.length > 0 && product.images[0]) {
    return product.images[0];
  }
  return categoryPlaceholders[product?.category] || categoryPlaceholders["Other"];
}

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
        imageUrl: getProductImage(product),
      });
    }
    localStorage.setItem("artisan_cart", JSON.stringify(current));
    toast.success("Added to cart");
  }

  if (!product) return <p className="empty">Loading product...</p>;

  return (
    <section className="detail-layout">
      <div className="gallery">
        <img src={getProductImage(product)} alt={product.title} />
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
