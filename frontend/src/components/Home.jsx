import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, money } from "../store/authStore.jsx";

const categories = [
  "All",
  "Pottery",
  "Textiles",
  "Jewelry",
  "Woodwork",
  "Painting",
  "Metalwork",
  "Leather",
  "Bamboo & Cane",
  "Embroidery",
  "Other",
];

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

function Home() {
  const [products, setProducts] = useState([]);
  const [artisans, setArtisans] = useState([]);
  const [filters, setFilters] = useState({ category: "All", sort: "newest" });

  async function loadProducts(nextFilters = filters) {
    const query = new URLSearchParams(
      Object.entries(nextFilters).filter(([, value]) => value && value !== "All")
    );
    const data = await api(`/product-api?${query.toString()}`);
    setProducts(data.payload || []);
  }

  async function loadArtisans() {
    const data = await api("/buyer-api/artisans");
    setArtisans(data.payload || []);
  }

  function handleFilter(event) {
    event.preventDefault();
    loadProducts(filters).catch((error) => toast.error(error.message));
  }

  useEffect(() => {
    loadProducts().catch((error) => toast.error(error.message));
    loadArtisans().catch(() => setArtisans([]));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Direct from makers</p>
          <h1>artisan-marketplace</h1>
          <p>
            Shop pottery, textiles, jewelry, woodwork, paintings, and regional crafts from rural
            Indian artisans with verified KYC profiles.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#shop">
              Browse crafts
            </a>
            <Link className="button ghost" to="/register">
              Join as artisan
            </Link>
          </div>
        </div>
        <aside className="hero-panel">
          <span>Vendor KYC</span>
          <strong>Admin-reviewed artisan onboarding</strong>
          <span>Razorpay</span>
          <strong>Secure INR payment integration</strong>
          <span>Story section</span>
          <strong>Every maker gets a public craft profile</strong>
        </aside>
      </section>

      <section className="toolbar" id="shop">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h2>Explore handmade collections</h2>
        </div>
        <form className="filters" onSubmit={handleFilter}>
          <input
            type="search"
            placeholder="Search crafts, materials, tags"
            value={filters.search || ""}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />
          <select
            value={filters.category}
            onChange={(event) => setFilters({ ...filters, category: event.target.value })}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            placeholder="Min INR"
            value={filters.minPrice || ""}
            onChange={(event) => setFilters({ ...filters, minPrice: event.target.value })}
          />
          <input
            type="number"
            min="0"
            placeholder="Max INR"
            value={filters.maxPrice || ""}
            onChange={(event) => setFilters({ ...filters, maxPrice: event.target.value })}
          />
          <select
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
          <button className="button primary" type="submit">
            Filter
          </button>
        </form>
      </section>

      <section className="grid products">
        {products.map((product) => (
          <article className="product-card" key={product._id}>
            <img src={getProductImage(product)} alt={product.title} />
            <div className="card-body">
              <div className="chip-row">
                <span className="chip">{product.category}</span>
                {product.handmade && <span className="chip">Handmade</span>}
              </div>
              <h3>{product.title}</h3>
              <p className="muted clamp">{product.description}</p>
              <strong className="price">{money(product.price)}</strong>
              <small className="muted">
                By {product.artisan?.businessName || product.artisan?.firstName || "Artisan"}
              </small>
              <Link className="button primary" to={`/product/${product._id}`}>
                View story
              </Link>
            </div>
          </article>
        ))}
      </section>
      {!products.length && <p className="empty">No approved products found yet.</p>}

      <section className="split-section">
        <div>
          <p className="eyebrow">Stories</p>
          <h2>Meet verified artisans</h2>
          <p className="muted">Each profile carries the maker story buyers want to trust.</p>
        </div>
        <div className="artisan-list">
          {artisans.map((artisan) => (
            <article className="artisan-card" key={artisan._id}>
              <img
                src={
                  artisan.storyImageUrl ||
                  artisan.profileImageUrl ||
                  artisan.fallbackProductImage ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                    artisan.businessName || artisan.firstName
                  )}`
                }
                alt={artisan.businessName || artisan.firstName}
              />
              <div className="card-body">
                <h3>{artisan.businessName || `${artisan.firstName} ${artisan.lastName || ""}`}</h3>
                <p className="muted">{artisan.location || "India"}</p>
                <p className="clamp">{artisan.story || artisan.bio || "A verified artisan sharing handmade craft traditions directly with buyers."}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
