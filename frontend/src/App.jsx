import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./components/RootLayout.jsx";
import Home from "./components/Home.jsx";
import Login from "./components/Login.jsx";
import Register from "./components/Register.jsx";
import ProductDetails from "./components/ProductDetails.jsx";
import Cart from "./components/Cart.jsx";
import BuyerProfile from "./components/BuyerProfile.jsx";
import ArtisanProfile from "./components/ArtisanProfile.jsx";
import AdminProfile from "./components/AdminProfile.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Unauthorized from "./components/Unauthorized.jsx";

function App() {
  const routerObj = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },
        { path: "product/:id", element: <ProductDetails /> },
        {
          path: "cart",
          element: (
            <ProtectedRoute allowedRoles={["BUYER"]}>
              <Cart />
            </ProtectedRoute>
          ),
        },
        {
          path: "buyer-profile",
          element: (
            <ProtectedRoute allowedRoles={["BUYER"]}>
              <BuyerProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "artisan-profile",
          element: (
            <ProtectedRoute allowedRoles={["ARTISAN"]}>
              <ArtisanProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "admin-profile",
          element: (
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminProfile />
            </ProtectedRoute>
          ),
        },
        { path: "unauthorized", element: <Unauthorized /> },
      ],
    },
  ]);

  return <RouterProvider router={routerObj} />;
}

export default App;
