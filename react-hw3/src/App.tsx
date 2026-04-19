import {
  useState, useEffect, useRef, useCallback, useMemo,
  useReducer, useContext, createContext, memo,
  lazy, Suspense, Component
} from "react"
import ReactDOM from "react-dom"

// 1

const RouterContext = createContext(null)

function Router({ children }) {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    function onPop() { setPath(window.location.pathname) }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  function navigate(to) {
    window.history.pushState({}, "", to)
    setPath(to)
  }

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  )
}

function Link({ to, children }) {
  const { navigate } = useContext(RouterContext)
  return (
    <a href={to} onClick={e => { e.preventDefault(); navigate(to) }}>
      {children}
    </a>
  )
}

function Route({ path, component }) {
  const { path: current } = useContext(RouterContext)
  return current === path ? component : null
}

function MiniRouter() {
  return (
    <Router>
      <div>
        <Link to="/home">Home</Link> | <Link to="/about">About</Link> | <Link to="/contact">Contact</Link>
        <Route path="/home"    component={<p>Home Page</p>} />
        <Route path="/about"   component={<p>About Page</p>} />
        <Route path="/contact" component={<p>Contact Page</p>} />
      </div>
    </Router>
  )
}



// 2

const ITEM_HEIGHT = 30
const VISIBLE_COUNT = 12

function VirtualizedList() {
  const items = useMemo(() => Array.from({ length: 10000 }, (_, i) => "Item " + (i + 1)), [])
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.floor(scrollTop / ITEM_HEIGHT)
  const endIndex   = Math.min(startIndex + VISIBLE_COUNT, items.length)
  const visible    = items.slice(startIndex, endIndex)

  return (
    <div
      style={{ height: ITEM_HEIGHT * VISIBLE_COUNT + "px", overflowY: "auto", border: "1px solid #ccc", position: "relative" }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * ITEM_HEIGHT + "px", position: "relative" }}>
        {visible.map((item, i) => (
          <div
            key={startIndex + i}
            style={{ position: "absolute", top: (startIndex + i) * ITEM_HEIGHT + "px", height: ITEM_HEIGHT + "px", lineHeight: ITEM_HEIGHT + "px", padding: "0 8px" }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}



// 3

function useAdvancedForm(initialValues, validate) {
  const [values,  setValues]  = useState(initialValues)
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})

  async function handleChange(e) {
    const { name, value } = e.target
    const next = { ...values, [name]: value }
    setValues(next)
    const errs = await validate(next)
    setErrors(errs)
  }

  function handleBlur(e) {
    setTouched(t => ({ ...t, [e.target.name]: true }))
  }

  function reset() {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return { values, errors, touched, handleChange, handleBlur, reset }
}

function AdvancedFormDemo() {
  const { values, errors, touched, handleChange, handleBlur, reset } = useAdvancedForm(
    { username: "", email: "" },
    async (vals) => {
      const e = {}
      if (vals.username.length < 3) e.username = "Min 3 characters"
      if (!vals.email.includes("@")) e.email = "Invalid email"
      return e
    }
  )

  return (
    <form onSubmit={e => e.preventDefault()}>
      <div>
        <input name="username" value={values.username} onChange={handleChange} onBlur={handleBlur} placeholder="Username" />
        {touched.username && errors.username && <span style={{ color: "red" }}> {errors.username}</span>}
      </div>
      <div>
        <input name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} placeholder="Email" />
        {touched.email && errors.email && <span style={{ color: "red" }}> {errors.email}</span>}
      </div>
      <button type="submit">Submit</button>
      <button type="button" onClick={reset}>Reset</button>
    </form>
  )
}



// 4

function LoginStateMachine() {
  const [status, setStatus] = useState("idle")
  const [user,   setUser]   = useState(null)

  function login() {
    setStatus("loading")
    setTimeout(() => {
      const success = Math.random() > 0.4
      if (success) {
        setUser({ name: "Ali Ahmed" })
        setStatus("success")
      } else {
        setStatus("error")
      }
    }, 1200)
  }

  switch (status) {
    case "idle":
      return <button onClick={login}>Login</button>
    case "loading":
      return <p>Logging in...</p>
    case "success":
      return <p>Welcome, {user.name}! <button onClick={() => setStatus("idle")}>Logout</button></p>
    case "error":
      return <p>Login failed. <button onClick={() => setStatus("idle")}>Try again</button></p>
    default:
      return null
  }
}



// 5

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}

function DebounceDemo() {
  const [input, setInput] = useState("")
  const debounced = useDebounce(input, 400)

  return (
    <div>
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type something..." />
      <p>Debounced: {debounced}</p>
    </div>
  )
}



// 6

function useEventListener(target, event, handler) {
  const savedHandler = useRef(handler)

  useEffect(() => { savedHandler.current = handler }, [handler])

  useEffect(() => {
    const el = target && "current" in target ? target.current : target
    if (!el) return
    const fn = e => savedHandler.current(e)
    el.addEventListener(event, fn)
    return () => el.removeEventListener(event, fn)
  }, [target, event])
}

function EventListenerDemo() {
  const [key,   setKey]   = useState("")
  const [click, setClick] = useState(0)
  const boxRef = useRef(null)

  useEventListener(window, "keydown", useCallback(e => setKey(e.key), []))
  useEventListener(boxRef, "click",   useCallback(() => setClick(c => c + 1), []))

  return (
    <div>
      <p>Last key pressed: <strong>{key || "none"}</strong></p>
      <div ref={boxRef} style={{ padding: "12px", background: "#eee", cursor: "pointer", color: "#000" }}>
        Click me (box clicks: {click})
      </div>
    </div>
  )
}



// 7

function StaleClosureCounter() {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)

  useEffect(() => { countRef.current = count }, [count])

  useEffect(() => {
    const id = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  function logCurrent() {
    alert("Current count: " + countRef.current)
  }

  return (
    <div>
      <p>Count (auto): {count}</p>
      <button onClick={logCurrent}>Log current (via ref)</button>
    </div>
  )
}



// 8

const resourceCache = new Map()

function createResource(key, fetcher) {
  if (resourceCache.has(key)) return resourceCache.get(key)
  const resource = { status: "loading", data: null, error: null }
  resource.promise = fetcher().then(d => {
    resource.status = "ready"
    resource.data   = d
  }).catch(() => {
    resource.status = "error"
  })
  resourceCache.set(key, resource)
  return resource
}

function ManualCacheDemo() {
  const [key, setKey] = useState(null)
  const [, forceUpdate] = useState(0)

  function load(k) {
    const res = createResource(k, () =>
      fetch("https://jsonplaceholder.typicode.com/users/" + k).then(r => r.json())
    )
    setKey(k)
    if (res.status === "loading") {
      res.promise.then(() => forceUpdate(n => n + 1))
    }
  }

  const res = key ? resourceCache.get(key) : null

  return (
    <div>
      <button onClick={() => load(1)}>Load User 1</button>
      <button onClick={() => load(2)}>Load User 2</button>
      <button onClick={() => load(3)}>Load User 3</button>
      {res && res.status === "loading" && <p>Loading...</p>}
      {res && res.status === "ready"   && <p>{res.data?.name} — {res.data?.email}</p>}
      {res && res.status === "error"   && <p>Error loading</p>}
    </div>
  )
}



// 9

function OptimisticComments() {
  const [comments, setComments] = useState([
    { id: 1, text: "First comment", confirmed: true }
  ])
  const [input, setInput] = useState("")

  function addComment() {
    if (!input.trim()) return
    const tempId = "temp-" + Date.now()
    const tempComment = { id: tempId, text: input.trim(), confirmed: false }

    setComments(prev => [...prev, tempComment])
    setInput("")

    setTimeout(() => {
      const success = Math.random() > 0.4
      if (success) {
        setComments(prev => prev.map(c => c.id === tempId ? { ...c, id: Date.now(), confirmed: true } : c))
      } else {
        setComments(prev => prev.filter(c => c.id !== tempId))
        alert("Failed to add comment. Rolled back.")
      }
    }, 1000)
  }

  return (
    <div>
      {comments.map(c => (
        <p key={c.id} style={{ opacity: c.confirmed ? 1 : 0.5 }}>
          {c.text} {!c.confirmed && "(saving...)"}
        </p>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} placeholder="New comment..." />
      <button onClick={addComment}>Add</button>
    </div>
  )
}



// 10

const ToastContext = createContext(null)

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg, type = "info") => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const colors = { info: "#333", success: "green", error: "red" }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {ReactDOM.createPortal(
        <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 9999 }}>
          {toasts.map(t => (
            <div key={t.id} style={{ background: colors[t.type], color: "white", padding: "10px 16px", marginTop: "8px", borderRadius: "4px", cursor: "pointer" }} onClick={() => dismiss(t.id)}>
              {t.msg}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

function useToast() { return useContext(ToastContext) }

function ToastSystemDemo() {
  const { addToast } = useToast()
  return (
    <div>
      <button onClick={() => addToast("Info message",     "info")}>Info Toast</button>
      <button onClick={() => addToast("Success!",         "success")}>Success Toast</button>
      <button onClick={() => addToast("Something failed", "error")}>Error Toast</button>
      <p>Click a toast to dismiss it early</p>
    </div>
  )
}



// 11

function UndoRedo() {
  const [past,    setPast]    = useState([])
  const [present, setPresent] = useState("")
  const [future,  setFuture]  = useState([])

  function handleChange(e) {
    const val = e.target.value
    setPast(p => [...p, present])
    setPresent(val)
    setFuture([])
  }

  const undo = useCallback(() => {
    if (past.length === 0) return
    const prev = past[past.length - 1]
    setPast(p => p.slice(0, -1))
    setFuture(f => [present, ...f])
    setPresent(prev)
  }, [past, present])

  const redo = useCallback(() => {
    if (future.length === 0) return
    const next = future[0]
    setFuture(f => f.slice(1))
    setPast(p => [...p, present])
    setPresent(next)
  }, [future, present])

  useEffect(() => {
    function handler(e) {
      if (e.ctrlKey && e.key === "z") { e.preventDefault(); undo() }
      if (e.ctrlKey && e.key === "y") { e.preventDefault(); redo() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo])

  return (
    <div>
      <textarea value={present} onChange={handleChange} rows={4} cols={40} placeholder="Type here..." />
      <div>
        <button onClick={undo} disabled={past.length === 0}>Undo (Ctrl+Z)</button>
        <button onClick={redo} disabled={future.length === 0}>Redo (Ctrl+Y)</button>
      </div>
    </div>
  )
}



// 12

function TrelloBoard() {
  const [board, setBoard] = useState({
    todo:       ["Design UI", "Write tests"],
    inprogress: ["Build API", "Fix bugs"],
    done:       ["Setup project"]
  })

  const dragInfo = useRef(null)

  function onDragStart(col, idx) {
    dragInfo.current = { col, idx }
  }

  function onDrop(targetCol) {
    const { col, idx } = dragInfo.current
    if (col === targetCol) return
    const card = board[col][idx]
    setBoard(prev => {
      const next = { ...prev }
      next[col]       = prev[col].filter((_, i) => i !== idx)
      next[targetCol] = [...prev[targetCol], card]
      return next
    })
    dragInfo.current = null
  }

  const colLabels = { todo: "To Do", inprogress: "In Progress", done: "Done" }

  return (
    <div style={{ display: "flex", gap: "16px" }}>
      {Object.entries(board).map(([col, cards]) => (
        <div
          key={col}
          onDragOver={e => e.preventDefault()}
          onDrop={() => onDrop(col)}
          style={{ background: "#f4f4f4", padding: "12px", minWidth: "160px", minHeight: "100px", borderRadius: "6px", color: "#000" }}
        >
          <strong>{colLabels[col]}</strong>
          {cards.map((card, idx) => (
            <div
              key={card}
              draggable
              onDragStart={() => onDragStart(col, idx)}
              style={{ background: "white", padding: "8px", margin: "6px 0", borderRadius: "4px", cursor: "grab", boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}
            >
              {card}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}



// 13

const LazyDashboard = lazy(() => new Promise(res => setTimeout(() => res({ default: () => <p>Dashboard Page (lazy loaded)</p> }), 800)))
const LazySettings  = lazy(() => new Promise(res => setTimeout(() => res({ default: () => <p>Settings Page (lazy loaded)</p> }),  800)))
const LazyProfile   = lazy(() => new Promise(res => setTimeout(() => res({ default: () => <p>Profile Page (lazy loaded)</p> }),   800)))

function CodeSplitDemo() {
  const [page, setPage] = useState("dashboard")

  return (
    <div>
      <button onClick={() => setPage("dashboard")}>Dashboard</button>
      <button onClick={() => setPage("settings")}>Settings</button>
      <button onClick={() => setPage("profile")}>Profile</button>
      <Suspense fallback={<p>Loading page...</p>}>
        {page === "dashboard" && <LazyDashboard />}
        {page === "settings"  && <LazySettings />}
        {page === "profile"   && <LazyProfile />}
      </Suspense>
    </div>
  )
}



// 14

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: "" }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <p style={{ color: "red" }}>Something went wrong: {this.state.message}</p>
          <button onClick={() => this.setState({ hasError: false, message: "" })}>Reset</button>
        </div>
      )
    }
    return this.props.children
  }
}

function BuggyComponent({ shouldThrow }) {
  if (shouldThrow) throw new Error("Intentional crash!")
  return <p>Component is healthy</p>
}

function ErrorBoundaryDemo() {
  const [crash, setCrash] = useState(false)
  return (
    <div>
      <button onClick={() => setCrash(v => !v)}>{crash ? "Fix" : "Crash"} Component</button>
      <ErrorBoundary>
        <BuggyComponent shouldThrow={crash} />
      </ErrorBoundary>
    </div>
  )
}



// 15

function MouseTracker({ children }) {
  const [pos, setPos] = useState({ x: 0, y: 0 })

  return (
    <div
      onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}
      style={{ border: "1px solid #ccc", padding: "12px", height: "150px" }}
    >
      {children(pos)}
    </div>
  )
}

function RenderPropsDemo() {
  return (
    <div>
      <MouseTracker>
        {({ x, y }) => <p>Mouse: {x}, {y}</p>}
      </MouseTracker>
      <MouseTracker>
        {({ x, y }) => (
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "red", position: "relative", left: Math.min(x % 300, 280) + "px", top: Math.min(y % 150, 130) + "px" }} />
        )}
      </MouseTracker>
    </div>
  )
}



// 16

function useHeadlessDropdown(options) {
  const [open,  setOpen]  = useState(false)
  const [index, setIndex] = useState(-1)
  const [value, setValue] = useState(null)

  function handleKeyDown(e) {
    if (!open) { if (e.key === "Enter" || e.key === " ") setOpen(true); return }
    if (e.key === "ArrowDown") setIndex(i => Math.min(i + 1, options.length - 1))
    if (e.key === "ArrowUp")   setIndex(i => Math.max(i - 1, 0))
    if (e.key === "Enter")     { setValue(options[index]); setOpen(false) }
    if (e.key === "Escape")    setOpen(false)
  }

  function select(opt) { setValue(opt); setOpen(false) }

  return { open, value, index, setOpen, select, handleKeyDown }
}

function HeadlessDropdown() {
  const options = ["Apple", "Banana", "Mango", "Grape"]
  const { open, value, index, setOpen, select, handleKeyDown } = useHeadlessDropdown(options)

  return (
    <div>
      <button onKeyDown={handleKeyDown} onClick={() => setOpen(v => !v)} aria-haspopup="listbox">
        {value || "Select a fruit"} v
      </button>
      {open && (
        <ul role="listbox" style={{ listStyle: "none", padding: "0", margin: "0", border: "1px solid #ccc" }}>
          {options.map((opt, i) => (
            <li key={opt} onClick={() => select(opt)} style={{ padding: "8px", background: i === index ? "#ddf" : "white", cursor: "pointer", color: "#000" }} role="option">
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}



// 17

function A11yModal() {
  const [open, setOpen] = useState(false)
  const closeRef   = useRef(null)
  const triggerRef = useRef(null)
  const prevFocus  = useRef(null)

  useEffect(() => {
    if (open) {
      prevFocus.current = document.activeElement
      closeRef.current?.focus()
    } else {
      prevFocus.current?.focus()
    }
  }, [open])

  useEffect(() => {
    function handler(e) {
      if (!open) return
      if (e.key === "Escape") setOpen(false)
      if (e.key === "Tab") { e.preventDefault(); closeRef.current?.focus() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  return (
    <div>
      <button ref={triggerRef} onClick={() => setOpen(true)}>Open Accessible Modal</button>
      {open && ReactDOM.createPortal(
        <div
          role="dialog"
          aria-modal="true"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
        >
          <div style={{ background: "white", color: "black", padding: "24px", borderRadius: "8px", minWidth: "280px" }}>
            <h2>Accessible Modal</h2>
            <p>Focus is trapped. Press ESC or Tab to close.</p>
            <button ref={closeRef} onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}



// 18

function useInView(ref) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return inView
}

function IntersectionBox({ label }) {
  const ref    = useRef(null)
  const inView = useInView(ref)

  return (
    <div ref={ref} style={{ height: "80px", margin: "12px 0", borderRadius: "6px", background: inView ? "green" : "#ccc", transition: "background 0.3s", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
      {label}: {inView ? "visible" : "not visible"}
    </div>
  )
}

function IntersectionDemo() {
  return (
    <div style={{ height: "200px", overflowY: "auto", border: "1px solid #ccc" }}>
      {Array.from({ length: 8 }, (_, i) => <IntersectionBox key={i} label={"Box " + (i + 1)} />)}
    </div>
  )
}



// 19

function InfiniteScroll() {
  const [items,      setItems]      = useState([])
  const [cursor,     setCursor]     = useState(0)
  const [isFetching, setIsFetching] = useState(false)
  const [hasMore,    setHasMore]    = useState(true)
  const loaderRef = useRef(null)

  async function loadMore() {
    if (isFetching || !hasMore) return
    setIsFetching(true)
    await new Promise(r => setTimeout(r, 600))
    const batch = Array.from({ length: 10 }, (_, i) => "Item " + (cursor + i + 1))
    const nextCursor = cursor + 10
    setItems(prev => [...prev, ...batch])
    setCursor(nextCursor)
    if (nextCursor >= 50) setHasMore(false)
    setIsFetching(false)
  }

  useEffect(() => { loadMore() }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore()
    })
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [cursor, isFetching, hasMore])

  return (
    <div style={{ height: "200px", overflowY: "auto", border: "1px solid #ccc" }}>
      {items.map((item, i) => <p key={i} style={{ padding: "4px 8px" }}>{item}</p>)}
      <div ref={loaderRef}>
        {isFetching && <p>Loading more...</p>}
        {!hasMore   && <p>No more items</p>}
      </div>
    </div>
  )
}



// 20

function createStore(reducer, initialState, middlewares = []) {
  let state     = initialState
  let listeners = []

  function getState() { return state }

  function dispatch(action) {
    const chain = middlewares.reduceRight((next, mw) => mw(next), (action) => {
      state = reducer(state, action)
      listeners.forEach(l => l())
    })
    chain(action)
  }

  function subscribe(listener) {
    listeners.push(listener)
    return () => { listeners = listeners.filter(l => l !== listener) }
  }

  return { getState, dispatch, subscribe }
}

const loggerMiddleware = (next) => (action) => {
  console.log("dispatch:", action)
  next(action)
}

function counterReducer(state, action) {
  switch (action.type) {
    case "INCREMENT": return { count: state.count + 1 }
    case "DECREMENT": return { count: state.count - 1 }
    case "RESET":     return { count: 0 }
    default:          return state
  }
}

const store = createStore(counterReducer, { count: 0 }, [loggerMiddleware])

function MiniReduxDemo() {
  const [state, setState] = useState(store.getState())

  useEffect(() => store.subscribe(() => setState({ ...store.getState() })), [])

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => store.dispatch({ type: "INCREMENT" })}>+</button>
      <button onClick={() => store.dispatch({ type: "DECREMENT" })}>-</button>
      <button onClick={() => store.dispatch({ type: "RESET" })}>Reset</button>
      <p style={{ fontSize: "12px" }}>Check console for logger output</p>
    </div>
  )
}



// 21

const ExpensiveChart = memo(function ExpensiveChart({ data, title }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: "12px", marginBottom: "8px" }}>
      <strong>{title}</strong>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "60px" }}>
        {data.map((v, i) => <div key={i} style={{ width: "20px", background: "steelblue", height: v + "%" }} />)}
      </div>
    </div>
  )
})

function MemoizedDashboard() {
  const [tick,   setTick]   = useState(0)
  const [filter, setFilter] = useState("all")

  const salesData   = useMemo(() => [40, 70, 55, 80, 60, 90, 50], [])
  const revenueData = useMemo(() => [30, 50, 45, 65, 75, 85, 40], [])

  const filtered = useMemo(() => {
    if (filter === "sales")   return [{ title: "Sales",   data: salesData }]
    if (filter === "revenue") return [{ title: "Revenue", data: revenueData }]
    return [{ title: "Sales", data: salesData }, { title: "Revenue", data: revenueData }]
  }, [filter, salesData, revenueData])

  return (
    <div>
      <p>Parent re-renders: {tick}</p>
      <button onClick={() => setTick(t => t + 1)}>Force Re-render</button>
      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option value="all">All Charts</option>
        <option value="sales">Sales Only</option>
        <option value="revenue">Revenue Only</option>
      </select>
      {filtered.map(c => <ExpensiveChart key={c.title} title={c.title} data={c.data} />)}
    </div>
  )
}



// 22

const queryCache = new Map()

function useQuery(key, fetcher, staleTime = 5000) {
  const [state, setState] = useState(() => queryCache.get(key) || { data: null, loading: true, error: null })

  useEffect(() => {
    const cached = queryCache.get(key)
    if (cached && cached.fetchedAt && Date.now() - cached.fetchedAt < staleTime) {
      setState(cached)
      return
    }
    setState(s => ({ ...s, loading: true }))
    fetcher()
      .then(data => {
        const next = { data, loading: false, error: null, fetchedAt: Date.now() }
        queryCache.set(key, next)
        setState(next)
      })
      .catch(error => setState({ data: null, loading: false, error }))
  }, [key])

  return state
}

function QueryDemo() {
  const [userId, setUserId] = useState(1)
  const { data, loading, error } = useQuery(
    "user-" + userId,
    () => fetch("https://jsonplaceholder.typicode.com/users/" + userId).then(r => r.json())
  )

  return (
    <div>
      <button onClick={() => setUserId(u => Math.max(1, u - 1))}  disabled={userId === 1}>Prev</button>
      <span> User {userId} </span>
      <button onClick={() => setUserId(u => Math.min(10, u + 1))} disabled={userId === 10}>Next</button>
      {loading && <p>Loading...</p>}
      {error   && <p>Error loading user</p>}
      {data    && <p>{data.name} - {data.email}</p>}
      <p style={{ fontSize: "12px" }}>Results cached for 5s</p>
    </div>
  )
}



// 23

function useMockWebSocket(onMessage) {
  const ws = useRef(null)
  const [status, setStatus] = useState("disconnected")

  function connect() {
    setStatus("connecting")
    setTimeout(() => {
      setStatus("connected")
      ws.current = {
        send: (msg) => setTimeout(() => onMessage("Echo: " + msg), 300),
        close: () => setStatus("disconnected")
      }
    }, 500)
  }

  function disconnect() { ws.current?.close(); ws.current = null; setStatus("disconnected") }
  function send(msg)    { ws.current?.send(msg) }

  return { status, connect, disconnect, send }
}

function WebSocketChat() {
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState("")

  const { status, connect, disconnect, send } = useMockWebSocket(
    useCallback((text) => setMessages(prev => [...prev, { from: "server", text }]), [])
  )

  function sendMessage() {
    if (!input.trim()) return
    setMessages(prev => [...prev, { from: "me", text: input.trim() }])
    send(input.trim())
    setInput("")
  }

  return (
    <div>
      <p>Status: <strong>{status}</strong></p>
      {status === "disconnected" && <button onClick={connect}>Connect</button>}
      {status === "connected"    && <button onClick={disconnect}>Disconnect</button>}
      {status === "connecting"   && <span>Connecting...</span>}
      <div style={{ height: "120px", overflowY: "auto", border: "1px solid #ccc", padding: "8px", margin: "8px 0" }}>
        {messages.map((m, i) => (
          <p key={i} style={{ textAlign: m.from === "me" ? "right" : "left", margin: "4px" }}>
            <strong>{m.from}:</strong> {m.text}
          </p>
        ))}
      </div>
      {status === "connected" && (
        <div>
          <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && sendMessage()} />
          <button onClick={sendMessage}>Send</button>
        </div>
      )}
    </div>
  )
}



// 24

const FeatureContext = createContext(null)

const featureConfig = {
  free:       { darkMode: true,  analytics: false, advancedExport: false },
  pro:        { darkMode: true,  analytics: true,  advancedExport: false },
  enterprise: { darkMode: true,  analytics: true,  advancedExport: true  }
}

function FeatureProvider({ plan, children }) {
  const flags = featureConfig[plan] || featureConfig.free
  return <FeatureContext.Provider value={flags}>{children}</FeatureContext.Provider>
}

function useFeature(name) {
  const flags = useContext(FeatureContext)
  return flags?.[name] ?? false
}

function FeatureGate({ name, children }) {
  const enabled = useFeature(name)
  return enabled ? children : <span style={{ color: "#aaa" }}>Locked: {name} not available on your plan</span>
}

function FeatureFlagsDemo() {
  const [plan, setPlan] = useState("free")

  return (
    <div>
      <select value={plan} onChange={e => setPlan(e.target.value)}>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
        <option value="enterprise">Enterprise</option>
      </select>
      <p>Current plan: <strong>{plan}</strong></p>
      <FeatureProvider plan={plan}>
        <p><FeatureGate name="darkMode">Dark Mode enabled</FeatureGate></p>
        <p><FeatureGate name="analytics">Analytics enabled</FeatureGate></p>
        <p><FeatureGate name="advancedExport">Advanced Export enabled</FeatureGate></p>
      </FeatureProvider>
    </div>
  )
}



// 25

function SlowItem({ name }) {
  return <li>{name}</li>
}

const FastItem = memo(function FastItem({ name, onRemove }) {
  return <li>{name} <button onClick={() => onRemove(name)}>x</button></li>
})

function PerformanceDemo() {
  const [tick,  setTick]  = useState(0)
  const [items, setItems] = useState(() => Array.from({ length: 50 }, (_, i) => "Item " + (i + 1)))
  const [query, setQuery] = useState("")

  const filteredSlow = items.filter(i => i.toLowerCase().includes(query.toLowerCase()))

  const filteredFast = useMemo(
    () => items.filter(i => i.toLowerCase().includes(query.toLowerCase())),
    [items, query]
  )

  const handleRemove = useCallback((name) => {
    setItems(prev => prev.filter(i => i !== name))
  }, [])

  return (
    <div>
      <button onClick={() => setTick(t => t + 1)}>Force re-render ({tick})</button>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search items..." />
      <div style={{ display: "flex", gap: "24px" }}>
        <div>
          <strong>Before (no memo)</strong>
          <ul style={{ height: "120px", overflowY: "auto" }}>
            {filteredSlow.slice(0, 10).map(i => <SlowItem key={i} name={i} />)}
          </ul>
        </div>
        <div>
          <strong>After (memo + useMemo + useCallback)</strong>
          <ul style={{ height: "120px", overflowY: "auto" }}>
            {filteredFast.slice(0, 10).map(i => <FastItem key={i} name={i} onRemove={handleRemove} />)}
          </ul>
        </div>
      </div>
    </div>
  )
}



// ─── App Navigation ───────────────────────────────────────────────────────────

const tasks = [
  { id: 1,  label: "Mini Router",                       component: <MiniRouter /> },
  { id: 2,  label: "Virtualized List (10k items)",      component: <VirtualizedList /> },
  { id: 3,  label: "Advanced Form Hook",                component: <AdvancedFormDemo /> },
  { id: 4,  label: "State Machine UI (Login)",          component: <LoginStateMachine /> },
  { id: 5,  label: "useDebounce Hook",                  component: <DebounceDemo /> },
  { id: 6,  label: "useEventListener Hook",             component: <EventListenerDemo /> },
  { id: 7,  label: "Prevent Stale Closure",             component: <StaleClosureCounter /> },
  { id: 8,  label: "Suspense-like Manual Cache",        component: <ManualCacheDemo /> },
  { id: 9,  label: "Optimistic Updates + Rollback",     component: <OptimisticComments /> },
  { id: 10, label: "Toast System (Context + Portal)",   component: <ToastSystemDemo /> },
  { id: 11, label: "Undo / Redo",                       component: <UndoRedo /> },
  { id: 12, label: "Drag & Drop Trello Board",          component: <TrelloBoard /> },
  { id: 13, label: "Code Splitting (lazy + Suspense)",  component: <CodeSplitDemo /> },
  { id: 14, label: "Error Boundary",                    component: <ErrorBoundaryDemo /> },
  { id: 15, label: "Render Props (MouseTracker)",       component: <RenderPropsDemo /> },
  { id: 16, label: "Headless Dropdown",                 component: <HeadlessDropdown /> },
  { id: 17, label: "Accessible Modal (A11y)",           component: <A11yModal /> },
  { id: 18, label: "useInView (Intersection Observer)", component: <IntersectionDemo /> },
  { id: 19, label: "Infinite Scroll + Cursor",          component: <InfiniteScroll /> },
  { id: 20, label: "Reducer + Logger Middleware",       component: <MiniReduxDemo /> },
  { id: 21, label: "Complex Memoization Dashboard",     component: <MemoizedDashboard /> },
  { id: 22, label: "Mini React Query (useQuery)",       component: <QueryDemo /> },
  { id: 23, label: "WebSocket Chat (mock)",             component: <WebSocketChat /> },
  { id: 24, label: "Feature Flags (Multi-tenant)",      component: <FeatureFlagsDemo /> },
  { id: 25, label: "Performance: Before vs After",      component: <PerformanceDemo /> }
]

export default function App() {
  const [active, setActive] = useState(1)
  const current = tasks.find(t => t.id === active)

  return (
    <ToastProvider>
      <div style={{ padding: "20px" }}>
        <h1>Advanced React Challenges</h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
          {tasks.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              style={{ fontWeight: active === t.id ? "bold" : "normal" }}
            >
              {t.id}
            </button>
          ))}
        </div>

        <h2>{current.id}. {current.label}</h2>

        <div style={{ marginTop: "16px" }}>
          {current.component}
        </div>
      </div>
    </ToastProvider>
  )
}