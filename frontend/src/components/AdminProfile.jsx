import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, money } from "../store/authStore.jsx";

function AdminProfile() {
  const [stats, setStats] = useState({});
  const [artisans, setArtisans] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  async function loadData() {
    const [statsData, artisanData, productData, orderData, allProductsData, allUsersData] = await Promise.all([
      api("/admin-api/stats"),
      api("/admin-api/artisans"),
      api("/admin-api/products/pending"),
      api("/admin-api/orders"),
      api("/admin-api/products"),
      api("/admin-api/users"),
    ]);
    setStats(statsData.payload || {});
    setArtisans(artisanData.payload || []);
    setProducts(productData.payload || []);
    setOrders(orderData.payload || []);
    setAllProducts(allProductsData.payload || []);
    setAllUsers(allUsersData.payload || []);
  }

  async function approveKyc(id, status) {
    await api(`/admin-api/artisan/${id}/kyc`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    toast.success(`KYC ${status.toLowerCase()}`);
    loadData();
  }

  async function reviewProduct(id, action) {
    await api(`/admin-api/products/${id}/${action}`, { method: "PUT" });
    toast.success(`Product ${action === "approve" ? "approved" : "rejected"}`);
    loadData();
  }

  async function deleteProduct(id) {
    const reason = prompt("Please enter the reason for deleting this product:");
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      toast.error("A reason is required to delete a product.");
      return;
    }

    try {
      await api(`/admin-api/products/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      toast.success("Product deleted successfully");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function toggleUserStatus(id) {
    try {
      await api(`/admin-api/users/${id}/toggle`, { method: "PUT" });
      toast.success("User status updated successfully");
      loadData();
    } catch (error) {
      toast.error(error.message);
    }
  }

  async function deleteUser(id) {
    if (!window.confirm("Are you sure you want to permanently delete this user and all their products?")) return;
    try {
      await api(`/admin-api/users/${id}`, { method: "DELETE" });
      toast.success("User and products deleted successfully");
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
      <div className="panel wide">
        <div className="section-title">
          <div>
            <p className="eyebrow">Admin dashboard</p>
            <h1>KYC, product approvals, and orders</h1>
          </div>
          <button className="button ghost" type="button" onClick={() => loadData()}>
            Refresh
          </button>
        </div>
        <div className="stats">
          {Object.entries(stats).map(([key, value]) => (
            <div className="stat" key={key}>
              <span className="muted">{key}</span>
              <strong>{key.toLowerCase().includes("revenue") ? money(value) : value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <p className="eyebrow">Product review</p>
        <h2>Pending listings</h2>
        <div className="admin-lists">
          {products.map((product) => (
            <div className="admin-row" key={product._id}>
              <span>
                {product.title} <small className="muted">{product.artisan?.businessName}</small>
              </span>
              <span className="row-actions">
                <button className="button primary" type="button" onClick={() => reviewProduct(product._id, "approve")}>
                  Approve
                </button>
                <button className="button ghost" type="button" onClick={() => reviewProduct(product._id, "reject")}>
                  Reject
                </button>
              </span>
            </div>
          ))}
          {!products.length && <p className="empty">No pending products.</p>}
        </div>
      </div>

      <div className="panel wide">
        <p className="eyebrow">Orders</p>
        <div className="admin-lists">
          {orders.map((order) => (
            <div className="admin-row" key={order._id}>
              <span>{order.buyer?.email || "Buyer"}</span>
              <strong>{money(order.totalAmount)}</strong>
            </div>
          ))}
          {!orders.length && <p className="empty">No orders yet.</p>}
        </div>
      </div>

      <div className="panel wide">
        <p className="eyebrow">Inventory management</p>
        <h2>All Products</h2>
        <div className="admin-lists">
          {allProducts.map((product) => (
            <div className="admin-row" key={product._id}>
              <span>
                {product.title}{" "}
                <small className="muted">
                  by {product.artisan?.businessName || "Unknown"} ({product.isApproved ? "Approved" : "Pending"})
                </small>
              </span>
              <span className="row-actions" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <strong>{money(product.price)}</strong>
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
          {!allProducts.length && <p className="empty">No products found in system.</p>}
        </div>
      </div>

      <div className="panel wide">
        <p className="eyebrow">User management</p>
        <h2>All Users & Artisans</h2>
        <div className="admin-lists">
          {allUsers.map((u) => (
            <div className="admin-row" key={u._id} style={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: "0.5rem", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{u.firstName} {u.lastName}</strong>{" "}
                  <span className="chip" style={{ marginLeft: "0.5rem" }}>{u.role}</span>
                  {u.businessName && <span className="chip" style={{ marginLeft: "0.5rem", background: "#eef4ef" }}>{u.businessName}</span>}
                  <div className="muted" style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>{u.email} • Status: <strong style={{ color: u.isActive ? "#126b58" : "#b43f2d" }}>{u.isActive ? "Active" : "Inactive"}</strong></div>
                </div>
                {u.role !== "ADMIN" && (
                  <div className="row-actions" style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className="button ghost small"
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                      type="button"
                      onClick={() => toggleUserStatus(u._id)}
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      className="button ghost small"
                      style={{ color: "#ff4d4f", borderColor: "#ff4d4f", padding: "0.25rem 0.5rem", fontSize: "0.85rem" }}
                      type="button"
                      onClick={() => deleteUser(u._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {u.role === "ARTISAN" && u.products && u.products.length > 0 && (
                <div style={{ borderTop: "1px dashed var(--line)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                  <small className="muted" style={{ fontWeight: 700 }}>Artisan Products:</small>
                  <ul style={{ margin: "0.25rem 0 0", paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
                    {u.products.map((p) => (
                      <li key={p._id} style={{ color: "var(--ink)" }}>
                        {p.title} ({money(p.price)}) - <span className="muted">{p.isApproved ? "Approved" : "Pending"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {!allUsers.length && <p className="empty">No users found.</p>}
        </div>
      </div>
    </section>
  );
}

export default AdminProfile;
