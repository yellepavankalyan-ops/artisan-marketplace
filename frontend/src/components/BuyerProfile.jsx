import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, money, cleanFormData } from "../store/authStore.jsx";

function BuyerProfile() {
  const [profile, setProfile] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);

  async function loadData() {
    const [profileData, wishlistData, ordersData] = await Promise.all([
      api("/buyer-api/profile"),
      api("/buyer-api/wishlist"),
      api("/order-api/my-orders"),
    ]);
    setProfile(profileData.payload);
    setWishlist(wishlistData.payload || []);
    setOrders(ordersData.payload || []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await api("/buyer-api/profile", { method: "PUT", body: cleanFormData(event.currentTarget) });
      toast.success("Profile updated");
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
      <form className="panel form" onSubmit={handleSubmit}>
        <p className="eyebrow">Buyer profile</p>
        <h1>{profile?.firstName || "Buyer"}</h1>
        <input name="firstName" placeholder="First name" defaultValue={profile?.firstName || ""} />
        <input name="lastName" placeholder="Last name" defaultValue={profile?.lastName || ""} />
        <input name="phone" placeholder="Phone" defaultValue={profile?.phone || ""} />
        <input name="address.street" placeholder="Street" defaultValue={profile?.address?.street || ""} />
        <input name="address.city" placeholder="City" defaultValue={profile?.address?.city || ""} />
        <input name="address.state" placeholder="State" defaultValue={profile?.address?.state || ""} />
        <input name="address.pincode" placeholder="Pincode" defaultValue={profile?.address?.pincode || ""} />
        <button className="button primary" type="submit">
          Save profile
        </button>
      </form>
      <div className="panel">
        <p className="eyebrow">Wishlist</p>
        <h2>Saved crafts</h2>
        <div className="cart-list">
          {wishlist.map((product) => (
            <div className="cart-row" key={product._id}>
              <span>{product.title}</span>
              <strong>{money(product.price)}</strong>
            </div>
          ))}
          {!wishlist.length && <p className="empty">No saved products yet.</p>}
        </div>
      </div>
      <div className="panel wide">
        <p className="eyebrow">Orders</p>
        <h2>Recent orders</h2>
        <div className="admin-lists">
          {orders.map((order) => (
            <div className="admin-row" key={order._id}>
              <span>{order.orderStatus}</span>
              <strong>{money(order.totalAmount)}</strong>
            </div>
          ))}
          {!orders.length && <p className="empty">No orders yet.</p>}
        </div>
      </div>
    </section>
  );
}

export default BuyerProfile;
