import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api, money, useAuth } from "../store/authStore.jsx";

function Cart() {
  const [items, setItems] = useState(JSON.parse(localStorage.getItem("artisan_cart") || "[]"));
  const { user } = useAuth();
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  function save(nextItems) {
    setItems(nextItems);
    localStorage.setItem("artisan_cart", JSON.stringify(nextItems));
  }

  async function handleCheckout(event) {
    event.preventDefault();
    if (!items.length) return toast.error("Add products to cart first");
    try {
      const order = await api("/order-api/create-razorpay-order", {
        method: "POST",
        body: JSON.stringify({ totalAmount }),
      });
      const shippingAddress = Object.fromEntries(new FormData(event.currentTarget).entries());
      const options = {
        key: order.payload.keyId,
        amount: order.payload.amount,
        currency: order.payload.currency,
        name: "artisan-marketplace",
        description: "Handmade craft order",
        order_id: order.payload.orderId,
        handler: async (response) => {
          await api("/order-api/verify-payment", {
            method: "POST",
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              items,
              totalAmount,
              shippingAddress,
            }),
          });
          save([]);
          toast.success("Order placed successfully");
        },
        prefill: { name: user?.firstName || "", email: user?.email || "" },
        theme: { color: "#126b58" },
      };
      if (!window.Razorpay) return toast.error("Razorpay script did not load");
      new window.Razorpay(options).open();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <section className="workbench">
      <div className="panel">
        <div className="section-title">
          <h1>Cart</h1>
          <button className="button ghost" type="button" onClick={() => save([])}>
            Clear
          </button>
        </div>
        <div className="cart-list">
          {items.map((item, index) => (
            <div className="cart-row" key={`${item.product}-${index}`}>
              <img src={item.imageUrl} alt={item.title} />
              <div>
                <strong>{item.title}</strong>
                <p className="muted">
                  {money(item.price)} x {item.quantity}
                </p>
              </div>
              <button className="button ghost" type="button" onClick={() => save(items.filter((_, itemIndex) => itemIndex !== index))}>
                Remove
              </button>
            </div>
          ))}
          {!items.length && <p className="empty">Your cart is empty.</p>}
          <strong className="price">Total {money(totalAmount)}</strong>
        </div>
      </div>
      <form className="panel form" onSubmit={handleCheckout}>
        <p className="eyebrow">Razorpay checkout</p>
        <h2>Shipping address</h2>
        <input name="street" placeholder="Street" required />
        <input name="city" placeholder="City" required />
        <input name="state" placeholder="State" required />
        <input name="pincode" placeholder="Pincode" required />
        <button className="button primary" type="submit">
          Pay with Razorpay
        </button>
      </form>
    </section>
  );
}

export default Cart;
