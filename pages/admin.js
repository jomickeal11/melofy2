import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { supabase } from '../lib/supabase'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  const [editingUserId, setEditingUserId] = useState(null)
  const [newCredits, setNewCredits] = useState(0)

  const fetchAdminData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)

      const res = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la récupération des données')

      setStats(data.stats)
      setProfiles(data.profiles)
      setOrders(data.orders)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleEditClick = (profile) => {
    setEditingUserId(profile.id)
    setNewCredits(profile.credits || 0)
  }

  const handleUpdateCredits = async (userId) => {
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/update-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ targetUserId: userId, credits: parseInt(newCredits) })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')

      setEditingUserId(null)
      fetchAdminData()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Tableau de bord Admin • Melofy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#0F172A' }}>
        <Sidebar user={user} />

        <main style={{ flex: 1, padding: '40px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <div>
                <h1 style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 32, color: '#fff', margin: '0 0 6px 0' }}>Administration</h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  Gestion des utilisateurs, des crédits et statistiques globales.
                </p>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444', padding: '14px 20px', borderRadius: 14, marginBottom: 24, fontSize: 14
              }}>
                {error}
              </div>
            )}

            {loading && !stats ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)' }}>Chargement des statistiques...</span>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 40
                }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '24px' }}>
                    <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Chansons totales</span>
                    <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginTop: 8, display: 'inline-block' }}>{stats?.songsCount || 0}</span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '24px' }}>
                    <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Chansons prêtes</span>
                    <span style={{ fontSize: 32, fontWeight: 800, color: '#10b981', marginTop: 8, display: 'inline-block' }}>{stats?.readySongs || 0}</span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '24px' }}>
                    <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Utilisateurs inscrits</span>
                    <span style={{ fontSize: 32, fontWeight: 800, color: '#a78bfa', marginTop: 8, display: 'inline-block' }}>{stats?.usersCount || 0}</span>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '24px' }}>
                    <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Revenus générés</span>
                    <span style={{ fontSize: 32, fontWeight: 800, color: '#f59e0b', marginTop: 8, display: 'inline-block' }}>{stats?.totalRevenue || '0.00'} XOF</span>
                  </div>
                </div>

                {/* Main Content Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                  
                  {/* Users Section */}
                  <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, color: '#fff', marginBottom: 16 }}>
                      Gestion des utilisateurs & crédits
                    </h2>
                    <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 20 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>Nom / ID</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>Plan</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>Crédits</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>Date d'inscription</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profiles.map((p) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <div style={{ fontWeight: 600 }}>{p.display_name || 'Utilisateur anonyme'}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all' }}>{p.id}</div>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 600, textTransform: 'uppercase', background: p.plan === 'premium' ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)',
                                  color: p.plan === 'premium' ? '#6C63FF' : 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: 4
                                }}>
                                  {p.plan || 'free'}
                                </span>
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                {editingUserId === p.id ? (
                                  <input
                                    type="number"
                                    value={newCredits}
                                    onChange={(e) => setNewCredits(e.target.value)}
                                    style={{
                                      width: 68, padding: '6px 8px', background: '#0d0d14', border: '1px solid rgba(255,255,255,0.15)',
                                      color: '#fff', borderRadius: 6, fontSize: 13
                                    }}
                                  />
                                ) : (
                                  <strong style={{ fontSize: 15 }}>{p.credits ?? 0}</strong>
                                )}
                              </td>
                              <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.45)' }}>
                                {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                {editingUserId === p.id ? (
                                  <div style={{ display: 'inline-flex', gap: 10 }}>
                                    <button onClick={() => handleUpdateCredits(p.id)} style={{
                                      background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer'
                                    }}>Sauvegarder</button>
                                    <button onClick={() => setEditingUserId(null)} style={{
                                      background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer'
                                    }}>Annuler</button>
                                  </div>
                                ) : (
                                  <button onClick={() => handleEditClick(p)} style={{
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6,
                                    padding: '6px 14px', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'background 0.2s'
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                                    Modifier crédits
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Orders Section */}
                  <div>
                    <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, color: '#fff', marginBottom: 16 }}>
                      Commandes & Paiements
                    </h2>
                    <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 20 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>ID</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>Montant</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600 }}>Date</th>
                            <th style={{ padding: '16px 20px', fontWeight: 600, textAlign: 'right' }}>Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((o) => (
                            <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }}>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all' }}>{o.id}</span>
                              </td>
                              <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                                {(o.amount / 100).toFixed(2)} {o.currency || 'XOF'}
                              </td>
                              <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.45)' }}>
                                {new Date(o.created_at).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                <span style={{
                                  fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                                  background: o.status === 'paid' ? 'rgba(16,185,129,0.15)' : o.status === 'failed' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                  color: o.status === 'paid' ? '#10b981' : o.status === 'failed' ? '#ef4444' : '#f59e0b',
                                  border: `1px solid ${o.status === 'paid' ? 'rgba(16,185,129,0.2)' : o.status === 'failed' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`
                                }}>
                                  {o.status === 'paid' ? 'Réussi' : o.status === 'failed' ? 'Échoué' : 'En attente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </>
  )
}
