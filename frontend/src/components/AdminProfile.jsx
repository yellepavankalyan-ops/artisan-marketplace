import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, money } from "../store/authStore.jsx";

function AdminProfile() {
  const [stats, setStats] = useState({});
  const [artisans, setArtisans] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  async function loadData() {
    const [statsData, artisanData, productData, orderData] = await Promise.all([
      api("/admin-api/stats"),
      api("/admin-api/artisans"),
      api("/admin-api/products/pending"),
      api("/admin-api/orders"),
    ]);
    setStats(statsData.payload || {});
    setArtisans(artisanData.payload || []);
    setProducts(productData.payload || []);
    setOrders(orderData.payload || []);
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
        <p className="eyebrow">Vendor KYC</p>
        <h2>Artisan approvals</h2>
        <div className="admin-lists">
          {artisans.map((artisan) => (
            <div className="admin-row" key={artisan._id}>
              <span>
                {artisan.businessName || artisan.firstName} <small className="muted">{artisan.kycStatus}</small>
              </span>
              <span className="row-actions">
                <button className="button primary" type="button" onClick={() => approveKyc(artisan._id, "APPROVED")}>
                  Approve
                </button>
                <button className="button ghost" type="button" onClick={() => approveKyc(artisan._id, "REJECTED")}>
                  Reject
                </button>
              </span>
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
    </section>
  );
}

export default AdminProfile;
