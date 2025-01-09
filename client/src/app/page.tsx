// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  title: string
  content: string
}

interface User {
  username: string
  token: string
}

export default function Home() {
  const [currentRoute, setCurrentRoute] = useState('/')
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const router = useRouter()
  const BASE_URL = 'http://localhost:5178'

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Sign in failed')

      const result = await response.json()
      const userData = { username: data.username as string, token: result.token }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      setCurrentRoute('/')
    } catch (error) {
      console.error('Sign in error:', error)
      alert('Sign in failed')
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.status !== 201) throw new Error('Sign up failed')

      alert('Sign up successful')
      setCurrentRoute('/signin')
    } catch (error) {
      console.error('Sign up error:', error)
      alert('Sign up failed')
    }
  }

  const handleCreatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch(`${BASE_URL}/api/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to create post')

      alert('Post created successfully')
      setCurrentRoute('/posts')
    } catch (error) {
      console.error('Create post error:', error)
      alert('Failed to create post')
    }
  }

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/post`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      })

      if (!response.ok) throw new Error('Failed to fetch posts')

      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('Fetch posts error:', error)
    }
  }

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`${BASE_URL}/api/post/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` }
      })

      if (!response.ok) throw new Error('Failed to delete post')

      alert('Post deleted successfully')
      fetchPosts()
    } catch (error) {
      console.error('Delete post error:', error)
      alert('Failed to delete post')
    }
  }

  const handleUpdatePost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const response = await fetch(`${BASE_URL}/api/post/${editingPost?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to update post')

      alert('Post updated successfully')
      setEditingPost(null)
      setCurrentRoute('/posts')
    } catch (error) {
      console.error('Update post error:', error)
      alert('Failed to update post')
    }
  }

  useEffect(() => {
    if (currentRoute === '/posts') {
      fetchPosts()
    }
  }, [currentRoute])

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
    setCurrentRoute('/')
  }

  const renderHeader = () => (
    <header>
      <nav>
        <button onClick={() => setCurrentRoute('/')}>Home</button>
        {user ? (
          <>
            <button onClick={() => setCurrentRoute('/posts')}>View Posts</button>
            <button onClick={() => setCurrentRoute('/new-post')}>New Post</button>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => setCurrentRoute('/signin')}>Sign In</button>
            <button onClick={() => setCurrentRoute('/signup')}>Sign Up</button>
          </>
        )}
      </nav>
    </header>
  )

  const renderContent = () => {
    switch (currentRoute) {
      case '/':
        return (
          <div>
            <h1>Welcome to our Blog</h1>
            {user ? (
              <p>Welcome, {user.username}!</p>
            ) : (
              <p>Please sign in to create and manage posts.</p>
            )}
          </div>
        )

      case '/signin':
        return (
          <div>
            <h2>Sign In</h2>
            <form onSubmit={handleSignIn}>
              <input type="text" name="username" placeholder="Username" required />
              <input type="password" name="password" placeholder="Password" required />
              <button type="submit">Sign In</button>
            </form>
          </div>
        )

      case '/signup':
        return (
          <div>
            <h2>Sign Up</h2>
            <form onSubmit={handleSignUp}>
              <input type="text" name="username" placeholder="Username" required />
              <input type="password" name="password" placeholder="Password" required />
              <button type="submit">Sign Up</button>
            </form>
          </div>
        )

      case '/new-post':
        return user ? (
          <div>
            <h2>Create New Post</h2>
            <form onSubmit={handleCreatePost}>
              <input type="text" name="title" placeholder="Title" required />
              <textarea name="content" placeholder="Content" required />
              <button type="submit">Create Post</button>
            </form>
          </div>
        ) : (
          <p>Please sign in to create posts.</p>
        )

      case '/posts':
        return user ? (
          <div>
            <h2>All Posts</h2>
            {posts.map(post => (
              <div key={post.id} className="post">
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                <button onClick={() => {
                  setEditingPost(post)
                  setCurrentRoute('/edit-post')
                }}>Edit</button>
                <button onClick={() => handleDeletePost(post.id)}>Delete</button>
              </div>
            ))}
          </div>
        ) : (
          <p>Please sign in to view posts.</p>
        )

      case '/edit-post':
        return editingPost ? (
          <div>
            <h2>Edit Post</h2>
            <form onSubmit={handleUpdatePost}>
              <input
                type="text"
                name="title"
                defaultValue={editingPost.title}
                required
              />
              <textarea
                name="content"
                defaultValue={editingPost.content}
                required
              />
              <button type="submit">Update Post</button>
            </form>
          </div>
        ) : (
          <p>No post selected for editing.</p>
        )

      default:
        return <p>Page not found</p>
    }
  }

  return (
    <main>
      {renderHeader()}
      {renderContent()}
    </main>
  )
}

// app/globals.css
