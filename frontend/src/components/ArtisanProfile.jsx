import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, money } from "../store/authStore.jsx";

const categories = [
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

function ArtisanProfile() {
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);

  async function loadData() {
    const [profileData, productData] = await Promise.all([
      api("/artisan-api/profile"),
      api("/artisan-api/products"),
    ]);
    setProfile(profileData.payload);
    setProducts(productData.payload || []);
  }

  async function updateProfile(event) {
    event.preventDefault();
    try {
      await api("/artisan-api/profile", { method: "PUT", body: new FormData(event.currentTarget) });
      toast.success("Artisan profile updated");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    try {
      await api("/artisan-api/products", { method: "POST", body: new FormData(event.currentTarget) });
      event.currentTarget.reset();
      toast.success("Product submitted for approval");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    loadData().catch((error) => toast.error(error.message));
  }, []);

  return (
    <section className="workbench">
      <form className="panel form" onSubmit={updateProfile}>
        <p className="eyebrow">Vendor onboarding with KYC</p>
        <h1>{profile?.businessName || "Artisan profile"}</h1>
        <span className="chip">KYC {profile?.kycStatus || "NOT_SUBMITTED"}</span>
        <input name="businessName" placeholder="Business name" defaultValue={profile?.businessName || ""} />
        <input name="location" placeholder="Village / district / state" defaultValue={profile?.location || ""} />
        <textarea name="bio" placeholder="Short bio" defaultValue={profile?.bio || ""}></textarea>
        <textarea name="story" placeholder="Your artisan story" defaultValue={profile?.story || ""}></textarea>
        <label className="file-field">
          KYC document
          <input name="kycDocumentUrl" type="file" />
        </label>
        <label className="file-field">
          Story image
          <input name="storyImageUrl" type="file" accept="image/*" />
        </label>
        <button className="button primary" type="submit">
          Save profile and KYC
        </button>
      </form>

      <form className="panel form" onSubmit={createProduct}>
        <p className="eyebrow">Seller tools</p>
        <h2>List a product</h2>
        <input name="title" placeholder="Product title" required />
        <textarea name="description" placeholder="Description" required></textarea>
        <div className="two-col">
          <input name="price" type="number" min="1" placeholder="Price" required />
          <input name="stock" type="number" min="0" placeholder="Stock" />
        </div>
        <select name="category" required>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <input name="materials" placeholder="Materials" />
        <input name="tags" placeholder="Tags comma separated" />
        <label className="file-field">
          Product images
          <input name="images" type="file" accept="image/*" multiple />
        </label>
        <button className="button primary" type="submit">
          Submit for admin approval
        </button>
      </form>

      <div className="panel wide">
        <p className="eyebrow">My products</p>
        <div className="admin-lists">
          {products.map((product) => (
            <div className="admin-row" key={product._id}>
              <span>
                {product.title} <small className="muted">{product.isApproved ? "Approved" : "Pending"}</small>
              </span>
              <strong>{money(product.price)}</strong>
            </div>
          ))}
          {!products.length && <p className="empty">No products submitted yet.</p>}
        </div>
      </div>
    </section>
  );
}

export default ArtisanProfile;
