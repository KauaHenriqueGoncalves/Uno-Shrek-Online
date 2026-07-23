import { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'

const DEFAULT_SOCKET_URL = 'http://localhost:3000'
const INITIAL_SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? DEFAULT_SOCKET_URL

function formatTimestamp(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleTimeString('pt-BR')
  } catch {
    return value
  }
}

export default function App() {
  const [socketUrl, setSocketUrl] = useState(INITIAL_SOCKET_URL)
  const [roomId, setRoomId] = useState('room-1')
  const [playerId, setPlayerId] = useState('')
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [socketId, setSocketId] = useState('')
  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('Desconectado')

  const socket = useMemo(() => {
    return io(socketUrl, {
      path: '/socket',
      autoConnect: false,
      transports: ['websocket'],
    })
  }, [socketUrl])

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true)
      setSocketId(socket.id ?? '')
      setStatus('Conectado')
    })

    socket.on('disconnect', () => {
      setConnected(false)
      setSocketId('')
      setStatus('Desconectado')
    })

    socket.on('room:list', (payload) => {
      setRooms(Array.isArray(payload) ? payload : [])
    })

    socket.on('room:joined', (payload) => {
      setCurrentRoom(payload)
      setRooms((prev) => {
        const next = prev.filter((room) => room.roomId !== payload.roomId)
        return [payload, ...next]
      })
      setMessages((prev) => [
        ...prev,
        {
          kind: 'system',
          text: `Entrou na sala ${payload.roomId}`,
          timestamp: new Date().toISOString(),
        },
      ])
    })

    socket.on('room:updated', (payload) => {
      if (!payload) return
      setCurrentRoom(payload)
      setRooms((prev) => {
        const next = prev.filter((room) => room.roomId !== payload.roomId)
        return [payload, ...next]
      })
    })

    socket.on('room:left', (payload) => {
      if (payload?.room) {
        setCurrentRoom(payload.room)
      } else {
        setCurrentRoom(null)
      }
      setMessages((prev) => [
        ...prev,
        {
          kind: 'system',
          text: `Saiu da sala ${roomId}`,
          timestamp: new Date().toISOString(),
        },
      ])
    })

    socket.on('room:message', (payload) => {
      setMessages((prev) => [...prev, { kind: 'chat', ...payload }])
    })

    socket.on('room:error', (payload) => {
      setStatus(payload?.message ?? 'Erro no socket')
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [socket])

  const connect = () => {
    if (!socket.connected) {
      socket.connect()
    }
  }

  const disconnect = () => {
    socket.disconnect()
  }

  const joinRoom = () => {
    socket.emit('room:join', { roomId, playerId, username }, (response) => {
      if (!response?.ok) {
        setStatus(response?.message ?? 'Falha ao entrar na sala')
      }
    })
  }

  const leaveRoom = () => {
    socket.emit('room:leave', { roomId }, (response) => {
      if (!response?.ok) {
        setStatus(response?.message ?? 'Falha ao sair da sala')
      }
    })
  }

  const sendMessage = () => {
    if (!message.trim()) return
    socket.emit('room:message', { roomId, message }, (response) => {
      if (!response?.ok) {
        setStatus(response?.message ?? 'Falha ao enviar mensagem')
      }
    })
    setMessage('')
  }

  const refreshState = () => {
    socket.emit('room:state', { roomId }, (response) => {
      if (response?.ok) {
        setCurrentRoom(response.room)
      } else {
        setStatus(response?.message ?? 'Falha ao buscar estado')
      }
    })
  }

  return (
    <div className="page-shell">
      <main className="app-card">
        <section className="hero">
          <p className="eyebrow">UnoShrek Socket Test</p>
          <h1>Teste o Socket.IO em sala antes de ligar o jogo real.</h1>
          <p className="subtitle">
            Conecte, entre em uma sala, troque mensagens e veja o estado ao vivo.
          </p>
        </section>

        <section className="status-strip">
          <div>
            <span className="label">Status</span>
            <strong>{status}</strong>
          </div>
          <div>
            <span className="label">Socket ID</span>
            <strong>{socketId || '-'}</strong>
          </div>
          <div>
            <span className="label">Conectado</span>
            <strong>{connected ? 'Sim' : 'Não'}</strong>
          </div>
        </section>

        <section className="grid">
          <article className="panel">
            <h2>Conexão</h2>
            <label>
              URL do backend
              <input value={socketUrl} onChange={(event) => setSocketUrl(event.target.value)} />
            </label>
            <div className="actions">
              <button onClick={connect}>Conectar</button>
              <button className="secondary" onClick={disconnect}>Desconectar</button>
            </div>
          </article>

          <article className="panel">
            <h2>Sala</h2>
            <label>
              Room ID
              <input value={roomId} onChange={(event) => setRoomId(event.target.value)} />
            </label>
            <label>
              Player ID
              <input value={playerId} onChange={(event) => setPlayerId(event.target.value)} placeholder="Opcional" />
            </label>
            <label>
              Username
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Opcional" />
            </label>
            <div className="actions">
              <button onClick={joinRoom}>Entrar</button>
              <button className="secondary" onClick={leaveRoom}>Sair</button>
              <button className="ghost" onClick={refreshState}>Estado</button>
            </div>
          </article>
        </section>

        <section className="grid split">
          <article className="panel">
            <h2>Mensagem</h2>
            <label>
              Texto
              <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Digite algo para a sala" />
            </label>
            <div className="actions">
              <button onClick={sendMessage}>Enviar</button>
            </div>
            <div className="hint">Evento usado: <span>room:message</span></div>
          </article>

          <article className="panel">
            <h2>Sala atual</h2>
            {currentRoom ? (
              <div className="room-box">
                <p><strong>ID:</strong> {currentRoom.roomId}</p>
                <p><strong>Max players:</strong> {currentRoom.maxPlayers ?? '-'}</p>
                <p><strong>Players:</strong> {currentRoom.players?.length ?? 0}</p>
                <ul>
                  {(currentRoom.players ?? []).map((player) => (
                    <li key={player.socketId}>
                      {player.username || player.socketId} {player.playerId ? `(${player.playerId})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="empty-state">Nenhuma sala selecionada.</p>
            )}
          </article>
        </section>

        <section className="panel">
          <h2>Mensagens</h2>
          <div className="message-list">
            {messages.length === 0 ? (
              <p className="empty-state">Ainda sem eventos.</p>
            ) : (
              messages.map((entry, index) => (
                <div className={`message ${entry.kind || 'chat'}`} key={`${entry.timestamp}-${index}`}>
                  <div className="message-meta">
                    <span>{entry.kind === 'system' ? 'Sistema' : entry.username || entry.socketId || 'Você'}</span>
                    <time>{formatTimestamp(entry.timestamp)}</time>
                  </div>
                  <p>{entry.text || entry.message}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel">
          <h2>Sala listada pelo backend</h2>
          <div className="room-list">
            {rooms.length === 0 ? (
              <p className="empty-state">Nenhuma sala disponível.</p>
            ) : (
              rooms.map((room) => (
                <button key={room.roomId} className="room-chip" onClick={() => setRoomId(room.roomId)}>
                  <span>{room.roomId}</span>
                  <small>{room.players?.length ?? 0}/{room.maxPlayers ?? '∞'}</small>
                </button>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
