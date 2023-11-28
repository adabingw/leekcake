// eslint-disable-next-line no-unused-vars
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CLI from "./CLI"
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route path="*" element={<CLI />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
