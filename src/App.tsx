import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// We'll create these later
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Users from './pages/Users';
import Movements from './pages/Movements';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="users" element={<Users />} />
          <Route path="movements" element={<Movements />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
