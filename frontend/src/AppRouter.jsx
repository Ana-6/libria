import { BrowserRouter, Route, Routes } from 'react-router-dom';

import App from './App';

import Admin from './pages/Admin';
import Authors from './pages/Authors';
import AuthorDetails from './pages/AuthorDetails';
import BookDetails from './pages/BookDetails';
import Categories from './pages/Categories';
import Community from './pages/Community';
import Explore from './pages/Explore';
import MyLibrary from './pages/MyLibrary';
import Profile from './pages/Profile';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import Reader from './pages/Reader';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />

        <Route path="/explorar" element={<Explore />} />
        <Route path="/libro/:bookId" element={<BookDetails />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/autores" element={<Authors />} />
        <Route path="/autores/:authorId" element={<AuthorDetails />} />
        <Route path="/comunidad" element={<Community />} />

        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        <Route
          path="/leer/:bookId"
          element={
            <ProtectedRoute>
              <Reader />
            </ProtectedRoute>
          }
        />

        <Route
          path="/biblioteca"
          element={
            <ProtectedRoute>
              <MyLibrary />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
