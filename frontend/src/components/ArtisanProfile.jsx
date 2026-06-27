import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, money, cleanFormData } from "../store/authStore.jsx";

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
  const [editingProduct, setEditingProduct] = useState(null);

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
    const form = event.currentTarget;
    try {
      await api("/artisan-api/profile", { method: "PUT", body: cleanFormData(form) });
      toast.success("Artisan profile updated");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      if (editingProduct) {
        await api(`/artisan-api/products/${editingProduct._id}`, {
          method: "PUT",
          body: new FormData(form),
        });
        toast.success("Product updated. Awaiting re-approval.");
        setEditingProduct(null);
      } else {
        await api("/artisan-api/products", {
          method: "POST",
          body: new FormData(form),
        });
        toast.success("Product submitted for approval");
      }
      form.reset();
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  function startEdit(product) {
    setEditingProduct(product);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(id) {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await api(`/artisan-api/products/${id}`, { method: "DELETE" });
      toast.success("Product deleted successfully");
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
      {profile?.notifications && profile.notifications.length > 0 && (
        <div className="panel wide" style={{ borderLeft: "4px solid #ff4d4f" }}>
          <p className="eyebrow" style={{ color: "#ff4d4f" }}>Messages / Notifications from Admin</p>
          <div className="admin-lists">
            {profile.notifications.slice().reverse().map((notif, idx) => (
              <div className="admin-row" key={idx} style={{ padding: "0.75rem 0" }}>
                <span>{notif.message}</span>
                <small className="muted">{new Date(notif.createdAt).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="panel form" onSubmit={updateProfile}>
        <p className="eyebrow">Vendor onboarding</p>
        <h1>{profile?.businessName || "Artisan profile"}</h1>
        <input name="businessName" placeholder="Business name" defaultValue={profile?.businessName || ""} />
        <input name="location" placeholder="Village / district / state" defaultValue={profile?.location || ""} />
        <textarea name="bio" placeholder="Short bio" defaultValue={profile?.bio || ""}></textarea>
        <textarea name="story" placeholder="Your artisan story" defaultValue={profile?.story || ""}></textarea>
        <button className="button primary" type="submit">
          Save profile
        </button>
      </form>

      <form
        className="panel form"
        key={editingProduct ? editingProduct._id : "new"}
        onSubmit={saveProduct}
      >
        <p className="eyebrow">Seller tools</p>
        <h2>{editingProduct ? "Edit product" : "List a product"}</h2>
        <input
          name="title"
          placeholder="Product title"
          defaultValue={editingProduct?.title || ""}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          defaultValue={editingProduct?.description || ""}
          required
        ></textarea>
        <div className="two-col">
          <input
            name="price"
            type="number"
            min="1"
            placeholder="Price"
            defaultValue={editingProduct?.price || ""}
            required
          />
          <input
            name="stock"
            type="number"
            min="0"
            placeholder="Stock"
            defaultValue={editingProduct?.stock !== undefined ? editingProduct.stock : ""}
          />
        </div>
        <select name="category" defaultValue={editingProduct?.category || "Pottery"} required>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <input
          name="materials"
          placeholder="Materials"
          defaultValue={editingProduct?.materials || ""}
        />
        <input
          name="tags"
          placeholder="Tags comma separated"
          defaultValue={editingProduct?.tags?.join(", ") || ""}
        />
        <label className="file-field">
          Product images / files {editingProduct && "(optional - leave blank to keep current)"}
          <input name="images" type="file" multiple />
        </label>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="button primary" style={{ flex: 1 }} type="submit">
            {editingProduct ? "Update product" : "Submit for admin approval"}
          </button>
          {editingProduct && (
            <button
              className="button ghost"
              type="button"
              onClick={() => setEditingProduct(null)}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <div className="panel wide">
        <p className="eyebrow">My products</p>
        <div className="admin-lists">
          {products.map((product) => (
            <div className="admin-row" key={product._id}>
              <span>
                {product.title} <small className="muted">{product.isApproved ? "Approved" : "Pending"}</small>
              </span>
              <span className="row-actions" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <strong>{money(product.price)}</strong>
                <button
                  className="button ghost small"
                  style={{ color: "#319795", borderColor: "#319795", padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                  type="button"
                  onClick={() => startEdit(product)}
                >
                  Edit
                </button>
                <button
                  className="button ghost small"
                  style={{ color: "#ff4d4f", borderColor: "#ff4d4f", padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                  type="button"
                  onClick={() => deleteProduct(product._id)}
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
          {!products.length && <p className="empty">No products submitted yet.</p>}
        </div>
      </div>
    </section>
  );
}

export default ArtisanProfile;
