import { useEffect, useState } from 'react'
import './App.css'

const API_URL = '/api/products'
const LOGIN_URL = '/api/login'
const LOGOUT_URL = '/api/logout'

function App() {
  // =========================
  // AUTHENTICATION
  // =========================

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('access_token')
  )

  const [username, setUsername] = useState(
    localStorage.getItem('username') || ''
  )

  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // =========================
  // PRODUCTS
  // =========================

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // =========================
  // ADD / EDIT FORM
  // =========================

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [productName, setProductName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')

  const [saving, setSaving] = useState(false)

  // =========================
  // GET ACCESS TOKEN
  // =========================

  const getAccessToken = () => {
    return localStorage.getItem('access_token')
  }

  // =========================
  // AUTH HEADERS
  // =========================

  const authHeaders = () => {
    const token = getAccessToken()

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }
  }

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async (event) => {
    event.preventDefault()

    setLoginError('')

    if (
      loginUsername.trim() === '' ||
      loginPassword === ''
    ) {
      setLoginError('Username and password are required.')
      return
    }

    try {
      setLoggingIn(true)

      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginUsername.trim(),
          password: loginPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.status !== true) {
        throw new Error(
          data.message || 'Invalid username or password.'
        )
      }

      localStorage.setItem(
        'access_token',
        data.tokens.access_token
      )

      localStorage.setItem(
        'refresh_token',
        data.tokens.refresh_token
      )

      localStorage.setItem(
        'username',
        data.user.username
      )

      setUsername(data.user.username)
      setIsLoggedIn(true)

      setLoginUsername('')
      setLoginPassword('')
      setLoginError('')
    } catch (err) {
      console.error(err)

      setLoginError(
        err.message || 'Unable to connect to Login API.'
      )
    } finally {
      setLoggingIn(false)
    }
  }

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = async () => {
    const refreshToken =
      localStorage.getItem('refresh_token')

    try {
      if (refreshToken) {
        await fetch(LOGOUT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        })
      }
    } catch (err) {
      console.error('Logout API error:', err)
    }

    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('username')

    setIsLoggedIn(false)
    setUsername('')
    setProducts([])
    setError('')
    setShowForm(false)
  }

  // =========================
  // LOAD PRODUCTS
  // =========================

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(API_URL, {
        method: 'GET',
        headers: authHeaders(),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          await handleLogout()
          return
        }

        throw new Error(
          data.message || `HTTP error: ${response.status}`
        )
      }

      if (data.status === true) {
        setProducts(data.data || [])
      } else {
        setError(
          data.message || 'Failed to load products.'
        )
      }
    } catch (err) {
      console.error(err)

      setError(
        err.message || 'Unable to connect to LavaLust API.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // LOAD PRODUCTS AFTER LOGIN
  // =========================

  useEffect(() => {
    if (isLoggedIn) {
      loadProducts()
    }
  }, [isLoggedIn])

  // =========================
  // RESET FORM
  // =========================

  const resetForm = () => {
    setProductName('')
    setDescription('')
    setPrice('')
    setQuantity('')
    setEditingId(null)
    setShowForm(false)
    setError('')
  }

  // =========================
  // OPEN ADD FORM
  // =========================

  const handleAddProduct = () => {
    setProductName('')
    setDescription('')
    setPrice('')
    setQuantity('')
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  // =========================
  // OPEN EDIT FORM
  // =========================

  const handleEditProduct = (product) => {
    setEditingId(product.id)
    setProductName(product.product_name)
    setDescription(product.description || '')
    setPrice(product.price)
    setQuantity(product.quantity)
    setError('')
    setShowForm(true)
  }

  // =========================
  // CANCEL FORM
  // =========================

  const handleCancel = () => {
    resetForm()
  }

  // =========================
  // SAVE / UPDATE PRODUCT
  // =========================

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (
      productName.trim() === '' ||
      price === '' ||
      quantity === ''
    ) {
      setError(
        'Product name, price, and quantity are required.'
      )
      return
    }

    try {
      setSaving(true)
      setError('')

      // =========================
      // ADD PRODUCT
      // =========================

      if (editingId === null) {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            product_name: productName.trim(),
            description: description.trim(),
            price: Number(price),
            quantity: Number(quantity),
          }),
        })

        const data = await response.json()

        if (response.status === 401) {
          await handleLogout()
          return
        }

        if (!response.ok || data.status !== true) {
          throw new Error(
            data.message || 'Failed to add product.'
          )
        }

        alert('Product added successfully!')
      }

      // =========================
      // UPDATE PRODUCT
      // =========================

      else {
        const response = await fetch(
          `${API_URL}/${editingId}`,
          {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({
              product_name: productName.trim(),
              description: description.trim(),
              price: Number(price),
              quantity: Number(quantity),
            }),
          }
        )

        const data = await response.json()

        if (response.status === 401) {
          await handleLogout()
          return
        }

        if (!response.ok || data.status !== true) {
          throw new Error(
            data.message || 'Failed to update product.'
          )
        }

        alert('Product updated successfully!')
      }

      resetForm()
      await loadProducts()
    } catch (err) {
      console.error(err)

      setError(
        err.message || 'Unable to save product.'
      )
    } finally {
      setSaving(false)
    }
  }

  // =========================
  // DELETE PRODUCT
  // =========================

  const handleDeleteProduct = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    )

    if (!confirmed) {
      return
    }

    try {
      setError('')

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: 'DELETE',
          headers: authHeaders(),
        }
      )

      const data = await response.json()

      if (response.status === 401) {
        await handleLogout()
        return
      }

      if (!response.ok || data.status !== true) {
        throw new Error(
          data.message || 'Failed to delete product.'
        )
      }

      alert('Product deleted successfully!')

      await loadProducts()
    } catch (err) {
      console.error(err)

      setError(
        err.message || 'Unable to delete product.'
      )
    }
  }

  // ==================================================
  // LOGIN SCREEN
  // ==================================================

  if (!isLoggedIn) {
    return (
      <div className="login-page">

        <div className="login-card">

          <div className="login-header">

            <div className="login-icon">
              🛍️
            </div>

            <h1 className="login-title">
              Product Management
            </h1>

            <p className="login-subtitle">
              Login to continue
            </p>

          </div>

          {loginError && (
            <div className="login-error">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>

            <div className="login-form-group">

              <label>
                Username
              </label>

              <input
                type="text"
                value={loginUsername}
                onChange={(event) =>
                  setLoginUsername(event.target.value)
                }
                placeholder="Enter username"
                autoComplete="username"
              />

            </div>

            <div className="login-form-group">

              <label>
                Password
              </label>

              <input
                type="password"
                value={loginPassword}
                onChange={(event) =>
                  setLoginPassword(event.target.value)
                }
                placeholder="Enter password"
                autoComplete="current-password"
              />

            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loggingIn}
            >
              {loggingIn
                ? 'Logging in...'
                : '🔐 Login'}
            </button>

          </form>

        </div>

      </div>
    )
  }

  // ==================================================
  // PRODUCT MANAGEMENT SCREEN
  // ==================================================

  return (
    <div className="app-container">

      {/* HEADER */}

      <div className="header">

        <h1>
          🛍️ Product Management
        </h1>

        <p>
          LavaLust React Frontend
        </p>

      </div>

      {/* MAIN CARD */}

      <div className="card">

        {/* TOP BAR */}

        <div className="top-bar">

          <div>
            <h2>
              Product List
            </h2>

            <small>
              Logged in as:{' '}
              <strong>{username}</strong>
            </small>
          </div>

          <div className="top-actions">

            <button
              className="add-btn"
              onClick={handleAddProduct}
            >
              + Add Product
            </button>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              🚪 Logout
            </button>

          </div>

        </div>

        {/* ERROR MESSAGE */}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* ADD / EDIT FORM */}

        {showForm && (
          <div className="form-container">

            <h3>
              {editingId === null
                ? 'Add New Product'
                : `Edit Product #${editingId}`}
            </h3>

            <form onSubmit={handleSubmit}>

              <div className="form-group">

                <label>
                  Product Name
                </label>

                <input
                  type="text"
                  value={productName}
                  onChange={(event) =>
                    setProductName(event.target.value)
                  }
                  placeholder="Enter product name"
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Enter product description"
                  rows="3"
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label>
                    Price
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(event) =>
                      setPrice(event.target.value)
                    }
                    placeholder="0.00"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value)
                    }
                    placeholder="0"
                    required
                  />

                </div>

              </div>

              <div className="form-actions">

                <button
                  type="submit"
                  className="save-btn"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingId === null
                    ? '💾 Save Product'
                    : '💾 Update Product'}
                </button>

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>

              </div>

            </form>

          </div>
        )}

        {/* LOADING */}

        {loading && (
          <p className="loading-text">
            Loading products...
          </p>
        )}

        {/* PRODUCT TABLE */}

        {!loading && (
          <div className="table-container">

            <table>

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Product Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {products.length === 0 ? (

                  <tr>

                    <td colSpan="6">
                      No products found.
                    </td>

                  </tr>

                ) : (

                  products.map((product) => (

                    <tr key={product.id}>

                      <td>
                        {product.id}
                      </td>

                      <td>
                        {product.product_name}
                      </td>

                      <td>
                        {product.description}
                      </td>

                      <td>
                        ₱{Number(product.price).toFixed(2)}
                      </td>

                      <td>
                        {product.quantity}
                      </td>

                      <td>

                        <button
                          className="edit-btn"
                          onClick={() =>
                            handleEditProduct(product)
                          }
                        >
                          ✏️ Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDeleteProduct(product.id)
                          }
                        >
                          🗑️ Delete
                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  )
}

export default App