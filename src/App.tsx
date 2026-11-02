import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { supabase } from './lib/supabase'

type IconName =
  | 'home'
  | 'compass'
  | 'library'
  | 'heart'
  | 'plus'
  | 'search'
  | 'bell'
  | 'play'
  | 'pause'
  | 'next'
  | 'previous'
  | 'shuffle'
  | 'repeat'
  | 'volume'
  | 'more'
  | 'upload'
  | 'music'
  | 'x'
  | 'check'
  | 'chevron'
  | 'download'
  | 'user'
  | 'camera'
  | 'edit'
  | 'trash'

function Icon({ name, size = 20, fill = false }: { name: IconName; size?: number; fill?: boolean }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15 9-2 4-4 2 2-4 4-2Z" /></>,
    library: <><path d="M5 4v16M9 4v16M14 5l4-1 3 15-4 1-3-15Z" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    next: <><path d="m7 5 9 7-9 7V5ZM18 5v14" /></>,
    previous: <><path d="m17 5-9 7 9 7V5ZM6 5v14" /></>,
    shuffle: <><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></>,
    repeat: <><path d="m17 2 4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></>,
    volume: <><path d="M11 5 6 9H2v6h4l5 4V5ZM15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M5 14H3v6h18v-6h-2" /></>,
    music: <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>,
    x: <path d="m5 5 14 14M19 5 5 19" />,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    download: <><path d="M12 3v13M7 11l5 5 5-5" /><path d="M4 20h16" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    camera: <><path d="M4 7h3l2-3h6l2 3h3v13H4V7Z" /><circle cx="12" cy="13" r="4" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4L16.5 3.5Z" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

type Song = {
  id: number | string
  title: string
  artist: string
  album: string
  duration: number
  cover: string
  audio: string
  mediaType?: 'audio' | 'video'
  audioPath?: string
  coverPath?: string
  liked?: boolean
  plays: string
  uploaded?: boolean
}

type Album = {
  id: number | string
  title: string
  description: string
  cover: string
  count: number
}

const images = {
  blue: 'https://images.unsplash.com/photo-1644353224392-7e532d7b8f4b?auto=format&fit=crop&w=800&q=85',
  mono: 'https://images.unsplash.com/photo-1608649443926-1e224443ef88?auto=format&fit=crop&w=800&q=85',
  neon: 'https://images.unsplash.com/photo-1770335435091-75e3f07cd5e8?auto=format&fit=crop&w=800&q=85',
  red: 'https://images.unsplash.com/photo-1612633974558-5925b621a8b4?auto=format&fit=crop&w=800&q=85',
  glow: 'https://images.unsplash.com/photo-1543868849-ca832301484f?auto=format&fit=crop&w=800&q=85',
  tunnel: 'https://images.unsplash.com/photo-1761083261633-5aa782b6ddfc?auto=format&fit=crop&w=800&q=85',
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const minute = Math.floor(seconds / 60)
  const second = Math.floor(seconds % 60)
  return `${minute}:${second.toString().padStart(2, '0')}`
}

const isVideoFile = (file: File) => file.type.startsWith('video/') || /\.(mp4|m4v|mov|webm)$/i.test(file.name)
const getMediaType = (file: File) => isVideoFile(file) ? 'video' : 'audio'
const getMediaContentType = (file: File) => {
  if (file.type) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'mov') return 'video/quicktime'
  if (extension === 'webm') return 'video/webm'
  if (isVideoFile(file)) return 'video/mp4'
  return extension === 'mp3' ? 'audio/mpeg' : undefined
}

const readMediaDuration = (file: File) => new Promise<number>((resolve) => {
  const media = document.createElement(isVideoFile(file) ? 'video' : 'audio')
  const url = URL.createObjectURL(file)
  const finish = (duration: number) => {
    window.clearTimeout(timeout)
    URL.revokeObjectURL(url)
    media.removeAttribute('src')
    resolve(duration)
  }
  const timeout = window.setTimeout(() => finish(0), 4000)
  media.preload = 'metadata'
  media.onloadedmetadata = () => finish(Number.isFinite(media.duration) ? Math.round(media.duration) : 0)
  media.onerror = () => finish(0)
  media.src = url
})

const extractFirstVideoFrame = (file: File) => new Promise<File>((resolve, reject) => {
  const video = document.createElement('video')
  const objectUrl = URL.createObjectURL(file)
  let settled = false
  let metadataReady = false
  let seekStarted = false
  let captureScheduled = false
  const finish = (cover?: File, error?: Error) => {
    if (settled) return
    settled = true
    window.clearTimeout(timeout)
    URL.revokeObjectURL(objectUrl)
    video.pause()
    video.removeAttribute('src')
    video.load()
    if (cover) resolve(cover)
    else reject(error || new Error('Không thể đọc frame đầu tiên của video.'))
  }
  const timeout = window.setTimeout(() => finish(undefined, new Error('Không lấy được frame video. Thử MP4 hoặc chọn ảnh bìa thủ công.')), 20000)
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.setAttribute('webkit-playsinline', 'true')

  const captureFrame = () => {
    if (settled || captureScheduled || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return
    captureScheduled = true
    const draw = () => {
      if (settled) return
      captureScheduled = false
      if (!video.videoWidth || !video.videoHeight) {
        finish(undefined, new Error('Video không có frame hình ảnh.'))
        return
      }
      const canvas = document.createElement('canvas')
      const scale = Math.min(1, 1280 / video.videoWidth, 1280 / video.videoHeight)
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale))
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        finish(undefined, new Error('Không thể tạo ảnh bìa từ video.'))
        return
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (!blob || blob.size === 0) {
          finish(undefined, new Error('Không thể xuất frame video thành ảnh.'))
          return
        }
        const baseName = file.name.replace(/\.[^.]+$/, '')
        finish(new File([blob], `${baseName}-cover.jpg`, { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.88)
    }

    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(() => draw())
    } else {
      window.requestAnimationFrame(() => window.requestAnimationFrame(draw))
    }
  }

  video.onloadedmetadata = () => {
    metadataReady = true
    const targetTime = Number.isFinite(video.duration) && video.duration > 0.2
      ? Math.min(0.1, video.duration / 2)
      : 0
    if (targetTime > 0) {
      seekStarted = true
      try {
        video.currentTime = targetTime
      } catch {
        captureFrame()
      }
    } else {
      captureFrame()
    }
  }
  video.onseeked = () => captureFrame()
  video.onloadeddata = () => {
    if (metadataReady && !seekStarted) captureFrame()
  }
  video.onerror = () => finish(undefined, new Error('Không đọc được video. Thử MP4 hoặc chọn ảnh bìa thủ công.'))
  video.src = objectUrl
  video.load()
})

const uploadFileToStorage = async (
  file: File,
  path: string,
  contentType: string | undefined,
  onProgress?: (progress: number) => void,
) => {
  if (file.size <= 6 * 1024 * 1024) {
    const { error } = await supabase.storage.from('music').upload(path, file, { contentType, upsert: false })
    if (error) throw error
    onProgress?.(100)
    return
  }

  const [{ data: { session }, error: sessionError }] = await Promise.all([supabase.auth.getSession()])
  if (sessionError) throw sessionError
  if (!session) throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const { Upload } = await import('tus-js-client')

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `${supabaseUrl}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        apikey: publishableKey,
        'x-upsert': 'false',
      },
      metadata: {
        bucketName: 'music',
        objectName: path,
        contentType: contentType || 'application/octet-stream',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024,
      onError: reject,
      onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    })
    upload.start()
  })
}

type AuthPayload = { mode: 'login' | 'register'; name: string; email: string; password: string }

function AuthScreen({ onSubmit, onForgotPassword }: {
  onSubmit: (payload: AuthPayload) => Promise<string | null>
  onForgotPassword: (email: string) => Promise<void>
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setFeedback('')
    try {
      setFeedback((await onSubmit({ mode, name: name.trim(), email: email.trim(), password })) ?? '')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể xác thực tài khoản.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page auth-premium">
      <div className="auth-ambient ambient-one" />
      <div className="auth-ambient ambient-two" />
      <header className="auth-premium-header">
        <div className="auth-logo">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <strong>VIBRA</strong>
        </div>
        <div className="auth-header-actions">
          <div className="auth-header-note"><span /> Miễn phí cho mọi người</div>
          {!Capacitor.isNativePlatform() && <a className="android-download-link" href="/Vibra.apk" download="Vibra-Android.apk"><Icon name="download" size={16} /> Tải app Android</a>}
        </div>
      </header>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-card-logo">
            <span className="auth-logo-disc"><Icon name="music" size={24} /></span>
            <span className="auth-kicker">{mode === 'login' ? 'Chào mừng trở lại' : 'Gia nhập VIBRA'}</span>
          </div>
          <h1>{mode === 'login' ? 'Âm nhạc đang chờ bạn.' : 'Bắt đầu câu chuyện của bạn.'}</h1>
          <p className="auth-subtitle">{mode === 'login' ? 'Đăng nhập để tiếp tục từ nơi bạn đã dừng lại.' : 'Tạo tài khoản để lưu giữ mọi giai điệu yêu thích.'}</p>

          <div className="auth-tabs" role="tablist">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Đăng nhập</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Đăng ký</button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === 'register' && <label>Họ và tên<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Tên của bạn" /></label>}
            <label>Địa chỉ email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@email.com" /></label>
            <label>Mật khẩu
              <span className="password-field">
                <input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tối thiểu 6 ký tự" />
                <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Ẩn' : 'Hiện'}</button>
              </span>
            </label>
            {mode === 'login' && <div className="form-options"><label><input type="checkbox" /> Ghi nhớ tôi</label><button type="button" onClick={async () => {
              setFeedback('')
              try {
                await onForgotPassword(email.trim())
                setFeedback('Đã gửi email đặt lại mật khẩu nếu địa chỉ này đã đăng ký.')
              } catch (error) {
                setFeedback(error instanceof Error ? error.message : 'Không thể gửi email đặt lại mật khẩu.')
              }
            }}>Quên mật khẩu?</button></div>}
            <button className="auth-submit" type="submit" disabled={busy}>
              <span>{mode === 'login' ? 'Vào VIBRA' : 'Tạo tài khoản'}</span>
              <Icon name="chevron" size={17} />
            </button>
          </form>

          {feedback && <p className="auth-feedback" role="status">{feedback}</p>}
          <div className="auth-divider"><span>Kết nối an toàn</span></div>
          <p className="auth-terms">Bằng việc tiếp tục, bạn đồng ý với <button>Điều khoản</button> và <button>Chính sách bảo mật</button>.</p>
        </div>
        <div className="auth-benefits">
          <div><span><Icon name="heart" size={15} /></span><p><strong>Lưu mọi cảm xúc</strong><small>Bài hát yêu thích luôn bên bạn</small></p></div>
          <div><span><Icon name="upload" size={15} /></span><p><strong>Nhạc của riêng bạn</strong><small>Tải lên và nghe ở bất cứ đâu</small></p></div>
          <div><span><Icon name="music" size={15} /></span><p><strong>Hoàn toàn miễn phí</strong><small>Không gói nâng cấp, không giới hạn</small></p></div>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user')
  const [userName, setUserName] = useState('')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountCreatedAt, setAccountCreatedAt] = useState('')
  const [songs, setSongs] = useState<Song[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [currentId, setCurrentId] = useState<number | string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(72)
  const [query, setQuery] = useState('')
  const [activeNav, setActiveNav] = useState('Khám phá')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadStep, setUploadStep] = useState<'pick' | 'details' | 'done'>('pick')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadArtist, setUploadArtist] = useState('')
  const [uploadCover, setUploadCover] = useState<string | null>(null)
  const [uploadCoverIsVideo, setUploadCoverIsVideo] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [albumOpen, setAlbumOpen] = useState(false)
  const [albumTitle, setAlbumTitle] = useState('')
  const [albumDescription, setAlbumDescription] = useState('')
  const [albumCover, setAlbumCover] = useState(images.blue)
  const [editingAlbumId, setEditingAlbumId] = useState<number | string | null>(null)
  const [songMenuId, setSongMenuId] = useState<number | string | null>(null)
  const [editingSongId, setEditingSongId] = useState<number | string | null>(null)
  const [editSongTitle, setEditSongTitle] = useState('')
  const [editSongArtist, setEditSongArtist] = useState('')
  const [editSongCover, setEditSongCover] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [extractingCover, setExtractingCover] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadCoverFile, setUploadCoverFile] = useState<File | null>(null)
  const [editSongCoverFile, setEditSongCoverFile] = useState<File | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const userIdRef = useRef<string | null>(null)

  const current = songs.find((song) => song.id === currentId)
  const playbackMedia = current?.mediaType === 'video' ? videoRef.current : audioRef.current
  const displayedSongs = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    let result = songs
    if (activeNav === 'Đã thích') result = result.filter((song) => song.liked)
    if (activeNav === 'Thư viện') result = result.filter((song) => song.uploaded)
    if (normalized) result = result.filter((song) => `${song.title} ${song.artist} ${song.album}`.toLocaleLowerCase('vi').includes(normalized))
    return result
  }, [songs, query, activeNav])

  useEffect(() => {
    let active = true
    const applySession = (session: { user: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> } } | null) => {
      if (!active) return
      if (session?.user.id !== userIdRef.current) {
        userIdRef.current = session?.user.id ?? null
        setUserRole('user')
      }
      setUserId(session?.user.id ?? null)
      setLoggedIn(Boolean(session))
      setAccountEmail(session?.user.email ?? '')
      setAccountCreatedAt(session?.user.created_at ?? '')
      if (session) setUserName(String(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || ''))
      setAuthReady(true)
    }
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setStatusMessage(error.message)
      applySession(data.session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applySession(session))
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId) return
    let active = true
    const loadLibrary = async () => {
      const [profileResult, tracksResult, albumsResult, likesResult] = await Promise.all([
        supabase.from('profiles').select('display_name, bio, role').eq('id', userId).maybeSingle(),
        supabase.from('tracks').select('*').order('created_at', { ascending: false }),
        supabase.from('albums').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('user_likes').select('track_id').eq('user_id', userId),
      ])
      if (!active) return
      const failure = profileResult.error || tracksResult.error || albumsResult.error || likesResult.error
      if (failure) {
        console.error('Unable to load account library:', failure)
        setStatusMessage('Không thể tải thư viện lúc này. Vui lòng thử lại sau.')
        return
      }
      const likedIds = new Set((likesResult.data ?? []).map((like) => like.track_id))
      const uploadedSongs: Song[] = await Promise.all((tracksResult.data ?? []).map(async (track) => {
        const [audioResult, coverResult] = await Promise.all([
          supabase.storage.from('music').createSignedUrl(track.audio_path, 3600),
          track.cover_path ? supabase.storage.from('music').createSignedUrl(track.cover_path, 3600) : Promise.resolve({ data: null, error: null }),
        ])
        if (audioResult.error) setStatusMessage(audioResult.error.message)
        if (coverResult.error) setStatusMessage(coverResult.error.message)
        return {
          id: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          duration: track.duration,
          cover: coverResult.data?.signedUrl || images.tunnel,
          audio: audioResult.data?.signedUrl || '',
          audioPath: track.audio_path,
          coverPath: track.cover_path,
          mediaType: track.media_type === 'video' ? 'video' : 'audio',
          liked: likedIds.has(String(track.id)),
          plays: track.plays,
          uploaded: true,
        }
      }))
      setSongs(uploadedSongs)
      setAlbums((albumsResult.data ?? []).map((album) => ({
        id: album.id,
        title: album.title,
        description: album.description,
        cover: album.cover_url || images.blue,
        count: uploadedSongs.filter((song) => song.album === album.title).length,
      })))
      if (profileResult.data) {
        setUserName(profileResult.data.display_name || userName)
        setProfileBio(profileResult.data.bio || '')
        setUserRole(profileResult.data.role === 'admin' ? 'admin' : 'user')
      }
      setCurrentId(uploadedSongs[0]?.id ?? null)
      setStatusMessage('')
    }
    void loadLibrary()
    return () => { active = false }
  }, [userId])

  useEffect(() => {
    const media = current?.mediaType === 'video' ? videoRef.current : audioRef.current
    if (!media) return
    media.volume = volume / 100
  }, [volume, current?.mediaType])

  useEffect(() => {
    const media = current?.mediaType === 'video' ? videoRef.current : audioRef.current
    if (!media) return
    if (playing) media.play().catch(() => setPlaying(false))
    else media.pause()
  }, [playing, currentId, current?.mediaType])

  const chooseSong = (id: number | string) => {
    if (id === currentId) setPlaying((value) => !value)
    else {
      setCurrentId(id)
      setProgress(0)
      setPlaying(true)
    }
  }

  const skip = (direction: number) => {
    if (!songs.length) return
    const index = songs.findIndex((song) => song.id === currentId)
    setCurrentId(songs[(index + direction + songs.length) % songs.length].id)
    setProgress(0)
    setPlaying(true)
  }

  const toggleLike = async (id: number | string) => {
    const song = songs.find((item) => item.id === id)
    if (!song || !userId) return
    const nextLiked = !song.liked
    setSongs((items) => items.map((item) => item.id === id ? { ...item, liked: nextLiked } : item))
    const result = nextLiked
      ? await supabase.from('user_likes').upsert({ user_id: userId, track_id: String(id) })
      : await supabase.from('user_likes').delete().eq('user_id', userId).eq('track_id', String(id))
    if (result.error) {
      setSongs((items) => items.map((item) => item.id === id ? { ...item, liked: !nextLiked } : item))
      setStatusMessage(result.error.message)
    }
  }

  const onTimeUpdate = () => {
    const media = current?.mediaType === 'video' ? videoRef.current : audioRef.current
    if (media && Number.isFinite(media.duration)) setProgress((media.currentTime / media.duration) * 100)
  }

  const seek = (value: number) => {
    setProgress(value)
    const media = current?.mediaType === 'video' ? videoRef.current : audioRef.current
    if (media && Number.isFinite(media.duration)) media.currentTime = (value / 100) * media.duration
  }

  const processFile = async (file?: File) => {
    if (!file || (!file.type.startsWith('audio/') && !isVideoFile(file) && !file.name.toLowerCase().endsWith('.mp3'))) return
    setUploadFile(file)
    setUploadTitle(file.name.replace(/\.[^.]+$/, ''))
    setStatusMessage('')
    setUploadCover(null)
    setUploadCoverFile(null)
    if (isVideoFile(file)) {
      setUploadCoverIsVideo(true)
      setExtractingCover(true)
      try {
        const cover = await extractFirstVideoFrame(file)
        setUploadCoverFile(cover)
        const reader = new FileReader()
        reader.onload = () => typeof reader.result === 'string' && setUploadCover(reader.result)
        reader.readAsDataURL(cover)
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Không thể tạo ảnh bìa từ video.')
      } finally {
        setExtractingCover(false)
      }
    } else {
      setUploadCoverFile(null)
      setUploadCover(null)
      setUploadCoverIsVideo(false)
    }
  }

  const closeUpload = () => {
    setUploadOpen(false)
    window.setTimeout(() => {
      setUploadStep('pick')
      setUploadFile(null)
      setUploadTitle('')
      setUploadArtist('')
      setUploadCover(null)
      setUploadCoverFile(null)
      setUploadCoverIsVideo(false)
    }, 250)
  }

  const saveUpload = async () => {
    if (!uploadFile || !uploadTitle.trim() || !userId || userRole !== 'admin') return
    setUploading(true)
    setUploadProgress(uploadFile.size > 6 * 1024 * 1024 ? 0 : null)
    setUploadStatus(uploadFile.size > 6 * 1024 * 1024 ? 'Đang tải file nhạc...' : 'Đang tải lên...')
    setStatusMessage('')
    const extension = uploadFile.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'audio'
    const audioPath = `${userId}/${crypto.randomUUID()}.${extension}`
    const audioContentType = getMediaContentType(uploadFile)
    let coverPath = ''
    let coverUploadPromise: Promise<void> = Promise.resolve()
    if (uploadCoverFile) {
      const coverExtension = uploadCoverFile.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
      coverPath = `${userId}/${crypto.randomUUID()}.${coverExtension}`
      coverUploadPromise = uploadFileToStorage(uploadCoverFile, coverPath, uploadCoverFile.type)
    }
    const durationPromise = readMediaDuration(uploadFile)
    try {
      await Promise.all([
        uploadFileToStorage(uploadFile, audioPath, audioContentType, (progress) => {
          setUploadProgress(uploadFile.size > 6 * 1024 * 1024 ? progress : null)
          setUploadStatus(progress === 100 ? 'Đang lưu thông tin bài hát...' : 'Đang tải file nhạc...')
        }),
        coverUploadPromise,
      ])
      setUploadProgress(100)
      setUploadStatus('Đang hoàn tất...')
      const duration = await durationPromise
      const [{ data: audioSigned, error: audioSignError }, { data: coverSigned, error: coverSignError }] = await Promise.all([
        supabase.storage.from('music').createSignedUrl(audioPath, 3600),
        coverPath ? supabase.storage.from('music').createSignedUrl(coverPath, 3600) : Promise.resolve({ data: null, error: null }),
      ])
      if (audioSignError || coverSignError || !audioSigned) throw new Error(audioSignError?.message || coverSignError?.message || 'Không thể tạo liên kết phát nhạc.')
      const { data, error } = await supabase.from('tracks').insert({
        user_id: userId,
        title: uploadTitle.trim(),
        artist: uploadArtist.trim() || 'Nghệ sĩ chưa xác định',
        album: isVideoFile(uploadFile) ? 'Video đã tải lên' : 'Nhạc đã tải lên',
        duration,
        cover_path: coverPath,
        audio_path: audioPath,
        media_type: getMediaType(uploadFile),
      }).select().single()
      if (error) throw error
      const newSong: Song = {
        id: data.id,
        title: data.title,
        artist: data.artist,
        album: data.album,
        duration: data.duration,
        cover: coverSigned?.signedUrl || images.tunnel,
        audio: audioSigned.signedUrl,
        audioPath,
        coverPath,
        mediaType: data.media_type === 'video' ? 'video' : 'audio',
        plays: data.plays,
        uploaded: true,
      }
      setSongs((items) => [newSong, ...items])
      setCurrentId(newSong.id)
      setUploadStep('done')
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Tải file thất bại. Vui lòng thử lại.')
    } finally {
      setUploading(false)
      setUploadProgress(null)
      setUploadStatus('')
    }
  }

  const processCover = async (file?: File) => {
    if (!file) return
    setStatusMessage('')
    let coverFile = file
    if (isVideoFile(file)) {
      setUploadCoverIsVideo(true)
      setExtractingCover(true)
      try {
        coverFile = await extractFirstVideoFrame(file)
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Không thể tạo ảnh bìa từ video.')
        setExtractingCover(false)
        return
      }
      setExtractingCover(false)
    } else if (!file.type.startsWith('image/')) {
      return
    } else {
      setUploadCoverIsVideo(false)
    }
    setUploadCoverFile(coverFile)
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' && setUploadCover(reader.result)
    reader.readAsDataURL(coverFile)
  }

  const createAlbum = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!albumTitle.trim() || !userId) return
    const values = {
      title: albumTitle.trim(),
      description: albumDescription.trim() || 'Album của riêng bạn',
      cover_url: albumCover,
    }
    if (editingAlbumId) {
      const { error } = await supabase.from('albums').update(values).eq('id', String(editingAlbumId)).eq('user_id', userId)
      if (error) {
        setStatusMessage(error.message)
        return
      }
      setAlbums((items) => items.map((album) => album.id === editingAlbumId ? { ...album, ...values, cover: albumCover } : album))
    } else {
      const { data, error } = await supabase.from('albums').insert({ ...values, user_id: userId }).select().single()
      if (error) {
        setStatusMessage(error.message)
        return
      }
      setAlbums((items) => [{ id: data.id, title: data.title, description: data.description, cover: data.cover_url, count: 0 }, ...items])
    }
    setAlbumOpen(false)
    setEditingAlbumId(null)
    setAlbumTitle('')
    setAlbumDescription('')
    setActiveNav('Thư viện')
  }

  const openAlbumEditor = (album: Album) => {
    setEditingAlbumId(album.id)
    setAlbumTitle(album.title)
    setAlbumDescription(album.description)
    setAlbumCover(album.cover)
    setAlbumOpen(true)
  }

  const deleteAlbum = async (id: number | string) => {
    if (typeof id === 'string') {
      const { error } = await supabase.from('albums').delete().eq('id', id).eq('user_id', userId)
      if (error) {
        setStatusMessage(error.message)
        return
      }
    }
    setAlbums((items) => items.filter((album) => album.id !== id))
  }

  const openSongEditor = (song: Song) => {
    setEditingSongId(song.id)
    setEditSongTitle(song.title)
    setEditSongArtist(song.artist)
    setEditSongCover(song.cover)
    setEditSongCoverFile(null)
    setSongMenuId(null)
  }

  const saveSongEdit = async (event: React.FormEvent) => {
    event.preventDefault()
    const song = songs.find((item) => item.id === editingSongId)
    if (!song || typeof song.id !== 'string' || !userId || userRole !== 'admin') return
    let coverUrl = song.cover
    let coverPath = song.coverPath || ''
    if (editSongCoverFile) {
      const extension = editSongCoverFile.name.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg'
      const path = `${userId}/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage.from('music').upload(path, editSongCoverFile, { contentType: editSongCoverFile.type })
      if (uploadError) {
        setStatusMessage(uploadError.message)
        return
      }
      coverPath = path
      const { data: signedCover, error: signError } = await supabase.storage.from('music').createSignedUrl(path, 3600)
      if (signError || !signedCover) {
        setStatusMessage(signError?.message || 'Không thể tạo liên kết ảnh bìa.')
        return
      }
      coverUrl = signedCover.signedUrl
    }
    const title = editSongTitle.trim() || song.title
    const artist = editSongArtist.trim() || 'Nghệ sĩ chưa xác định'
    const { error } = await supabase.from('tracks').update({ title, artist, cover_path: coverPath }).eq('id', song.id)
    if (error) {
      setStatusMessage(error.message)
      return
    }
    setSongs((items) => items.map((song) => song.id === editingSongId ? {
      ...song,
      title,
      artist,
      cover: coverUrl,
    } : song))
    setEditingSongId(null)
  }

  const deleteSong = async (id: number | string) => {
    if (userRole !== 'admin') return
    const song = songs.find((item) => item.id === id)
    if (typeof id === 'string') {
      const { error } = await supabase.from('tracks').delete().eq('id', id)
      if (error) {
        setStatusMessage(error.message)
        return
      }
      const paths = [song?.audioPath, song?.coverPath].filter((path): path is string => Boolean(path))
      if (paths.length) await supabase.storage.from('music').remove(paths)
    }
    const remaining = songs.filter((song) => song.id !== id)
    setSongs(remaining)
    if (currentId === id && remaining.length) {
      setCurrentId(remaining[0].id)
      setPlaying(false)
    }
    setSongMenuId(null)
  }

  const navItems: { label: string; icon: IconName }[] = [
    { label: 'Khám phá', icon: 'compass' },
    { label: 'Tìm kiếm', icon: 'search' },
    { label: 'Thư viện', icon: 'library' },
    { label: 'Đã thích', icon: 'heart' },
    { label: 'Hồ sơ', icon: 'user' },
  ]
  const activeNavItem = navItems.find((item) => item.label === activeNav) ?? navItems[0]

  const submitAuth = async ({ mode, name, email, password }: AuthPayload) => {
    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) throw error
      return data.session ? null : 'Tạo tài khoản thành công. Hãy xác nhận email để bắt đầu đăng nhập.'
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return null
  }

  const sendPasswordReset = async (email: string) => {
    if (!email) throw new Error('Nhập email để nhận liên kết đặt lại mật khẩu.')
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    if (error) throw error
  }

  const saveProfile = async () => {
    if (!userId) return
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      display_name: userName.trim(),
      bio: profileBio.trim(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    if (error) {
      setStatusMessage(error.message)
      setProfileSaved(false)
      return
    }
    setProfileSaved(true)
    setStatusMessage('Đã lưu hồ sơ.')
  }

  if (!loggedIn) {
    if (!authReady) return <main className="auth-page auth-premium"><p>Đang tải...</p></main>
    return <AuthScreen onSubmit={submitAuth} onForgotPassword={sendPasswordReset} />
  }

  return (
    <div className={`app-shell ${current ? '' : 'without-player'}`}>
      <aside className="sidebar">
        <button className="brand" onClick={() => setActiveNav('Khám phá')} aria-label="Về trang khám phá">
          <span className="brand-mark"><span /><span /><span /><span /></span>
          <span>VIBRA</span>
        </button>

        <nav className="nav-list" aria-label="Điều hướng chính">
          <p className="eyebrow">Menu</p>
          {navItems.map((item) => (
            <button key={item.label} className={`nav-item ${activeNav === item.label ? 'active' : ''}`} onClick={() => setActiveNav(item.label)}>
              <Icon name={item.icon} fill={item.label === 'Đã thích' && activeNav === item.label} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-playlists">
          <p className="eyebrow">Album của bạn</p>
          {albums.length ? albums.map((album) => (
            <button key={album.id} className="playlist-link" onClick={() => setActiveNav('Thư viện')}>
              <span>{album.title}</span>
              <span className="song-count">{album.count}</span>
            </button>
          )) : <span className="song-count">Chưa có album</span>}
          <button className="new-playlist" onClick={() => setAlbumOpen(true)}><Icon name="plus" size={17} /> Tạo album mới</button>
        </div>

        <button className="profile-mini" onClick={() => setActiveNav('Hồ sơ')}>
          <div className="avatar">{(userName || accountEmail || 'U').slice(0, 1).toUpperCase()}</div>
          <div><strong>{userName || accountEmail || 'Tài khoản'}</strong><span>Tài khoản VIBRA</span></div>
          <Icon name="chevron" size={16} />
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-page-title"><Icon name={activeNavItem.icon} size={18} /> {activeNavItem.label}</div>
          <div className="mobile-topbar-brand">
            <span className="brand-mark"><span /><span /><span /><span /></span>
            <strong>VIBRA</strong>
          </div>
          <div className="topbar-tools">
            {statusMessage && <p className="app-status" role="status">{statusMessage}</p>}
            {!Capacitor.isNativePlatform() && <a className="android-download-link" href="/Vibra.apk" download="Vibra-Android.apk"><Icon name="download" size={16} /> Tải app Android</a>}
          </div>
        </header>

        {activeNav === 'Khám phá' ? <>
        <section className="hero">
          <div className="hero-art" aria-hidden="true">
            <img src={images.neon} alt="" />
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
          </div>
          <div className="hero-content">
            <div className="featured-label"><span /> Không gian của bạn</div>
            <h1>Âm nhạc<br /><em>theo cách bạn.</em></h1>
            <p>Tạo thư viện riêng bằng những bài hát bạn tải lên và các album do bạn sắp xếp.</p>
            <div className="hero-actions">
              <button className="primary-action" onClick={() => setActiveNav('Thư viện')}>
                <Icon name="library" size={18} /> Mở thư viện
              </button>
              {userRole === 'admin'
                ? <button className="secondary-action" onClick={() => setUploadOpen(true)}><Icon name="upload" size={18} /> Tải nhạc lên</button>
                : <button className="secondary-action" onClick={() => setActiveNav('Tìm kiếm')}><Icon name="search" size={18} /> Tìm nhạc</button>}
            </div>
          </div>
          <div className="hero-index">01 <span>/ 05</span></div>
        </section>

        <section className="section-block album-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Bộ sưu tập cá nhân</p>
              <h2>Album của bạn</h2>
            </div>
            <button className="view-all" onClick={() => setAlbumOpen(true)}><Icon name="plus" size={15} /> Tạo album</button>
          </div>
          <div className="album-grid">
            <button className="create-album-card" onClick={() => setAlbumOpen(true)}>
              <span><Icon name="plus" size={24} /></span>
              <strong>Album mới</strong>
              <small>Tạo bộ sưu tập của riêng bạn</small>
            </button>
            {albums.map((album) => (
              <button className="album-card" key={album.id}>
                <span className="album-cover">
                  <img src={album.cover} alt="" />
                  <span className="album-play"><Icon name="play" size={18} fill /></span>
                </span>
                <strong>{album.title}</strong>
                <small>{album.count} bài hát · {album.description}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Dành riêng cho bạn</p>
              <h2>Bài hát của bạn</h2>
            </div>
            <button className="view-all">Xem tất cả <Icon name="chevron" size={16} /></button>
          </div>

          <div className="song-table">
            <div className="table-head"><span>#</span><span>Bài hát</span><span>Album</span><span>Lượt nghe</span><span>Thời lượng</span><span /></div>
            {displayedSongs.length > 0 ? displayedSongs.map((song, index) => (
              <div className={`song-row ${song.id === currentId ? 'current' : ''}`} key={song.id}>
                <button className="row-index" onClick={() => chooseSong(song.id)} aria-label={`${song.id === currentId && playing ? 'Tạm dừng' : 'Phát'} ${song.title}`}>
                  <span>{(index + 1).toString().padStart(2, '0')}</span>
                  <span className="row-play"><Icon name={song.id === currentId && playing ? 'pause' : 'play'} size={16} fill /></span>
                </button>
                <button className="song-main" onClick={() => chooseSong(song.id)}>
                  <img src={song.cover} alt="" />
                  <span><strong>{song.title}</strong><small>{song.artist}</small></span>
                  {song.id === currentId && playing && <span className="equalizer"><i /><i /><i /></span>}
                </button>
                <span className="album-name">{song.album}</span>
                <span className="plays">{song.plays}</span>
                <span className="duration">{formatTime(song.duration)}</span>
                <div className="row-actions">
                  <button onClick={() => toggleLike(song.id)} className={song.liked ? 'liked' : ''} aria-label="Yêu thích"><Icon name="heart" size={17} fill={song.liked} /></button>
                  <button aria-label="Thêm tùy chọn"><Icon name="more" size={18} /></button>
                </div>
              </div>
            )) : (
              <div className="empty-state">
                <span><Icon name="music" size={26} /></span>
                <h3>Chưa có bài hát nào</h3>
                <p>{query ? 'Thử tìm kiếm với một từ khóa khác nhé.' : 'Tải bài nhạc đầu tiên của bạn lên để bắt đầu.'}</p>
                {!query && <button onClick={() => setActiveNav('Tìm kiếm')}>Khám phá âm nhạc</button>}
              </div>
            )}
          </div>
        </section>
        </> : activeNav === 'Tìm kiếm' ? (
          <section className="search-page">
            <div className="page-intro search-intro">
              <p className="eyebrow">Tìm đúng thanh âm</p>
              <h1>Bạn muốn nghe gì?</h1>
              <p>Tìm bài hát và album trong thư viện của bạn.</p>
              <label className="search-hero-input">
                <Icon name="search" size={22} />
                <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nhập tên bài hát, nghệ sĩ hoặc album..." />
                {query && <button onClick={() => setQuery('')} aria-label="Xóa tìm kiếm"><Icon name="x" size={17} /></button>}
              </label>
            </div>

            {!query ? (
              <div className="search-results">
                <div className="section-heading"><div><p className="eyebrow">Thư viện</p><h2>{songs.length} bài hát</h2></div></div>
                <div className="compact-song-list">
                  {songs.length ? songs.map((song, index) => (
                    <div className={`compact-song ${song.id === currentId ? 'current' : ''}`} key={song.id}>
                      <button className="compact-play" onClick={() => chooseSong(song.id)}><img src={song.cover} alt="" /><span><Icon name={song.id === currentId && playing ? 'pause' : 'play'} size={16} fill /></span></button>
                      <div className="compact-info"><strong>{song.title}</strong><small>{song.artist} · {song.album}</small></div>
                      <span className="compact-index">{(index + 1).toString().padStart(2, '0')}</span>
                      <span className="compact-duration">{formatTime(song.duration)}</span>
                      <button className={song.liked ? 'liked' : ''} onClick={() => toggleLike(song.id)}><Icon name="heart" size={17} fill={song.liked} /></button>
                    </div>
                  )) : <div className="empty-state"><span><Icon name="music" size={26} /></span><h3>Thư viện đang trống</h3><p>{userRole === 'admin' ? 'Tải nhạc lên để thêm bài hát vào thư viện.' : 'Nhạc mới sẽ xuất hiện tại đây khi được quản trị viên thêm vào.'}</p>{userRole === 'admin' && <button onClick={() => setUploadOpen(true)}>Tải nhạc lên</button>}</div>}
                </div>
              </div>
            ) : (
              <div className="search-results">
                <div className="section-heading"><div><p className="eyebrow">Kết quả tìm kiếm</p><h2>{displayedSongs.length} kết quả cho “{query}”</h2></div></div>
                <div className="compact-song-list">
                  {displayedSongs.length ? displayedSongs.map((song, index) => (
                    <div className={`compact-song ${song.id === currentId ? 'current' : ''}`} key={song.id}>
                      <button className="compact-play" onClick={() => chooseSong(song.id)}><img src={song.cover} alt="" /><span><Icon name={song.id === currentId && playing ? 'pause' : 'play'} size={16} fill /></span></button>
                      <div className="compact-info"><strong>{song.title}</strong><small>{song.artist} · {song.album}</small></div>
                      <span className="compact-index">{(index + 1).toString().padStart(2, '0')}</span>
                      <span className="compact-duration">{formatTime(song.duration)}</span>
                      <button className={song.liked ? 'liked' : ''} onClick={() => toggleLike(song.id)}><Icon name="heart" size={17} fill={song.liked} /></button>
                    </div>
                  )) : <div className="empty-state"><span><Icon name="search" size={26} /></span><h3>Không tìm thấy kết quả</h3><p>Thử tên bài hát, nghệ sĩ hoặc từ khóa khác nhé.</p></div>}
                </div>
              </div>
            )}
          </section>
        ) : activeNav === 'Thư viện' || activeNav === 'Đã thích' ? (
          <section className="collection-page">
            <div className={`collection-hero ${activeNav === 'Đã thích' ? 'liked-hero' : ''}`}>
              <div className="collection-icon"><Icon name={activeNav === 'Đã thích' ? 'heart' : 'library'} size={30} fill={activeNav === 'Đã thích'} /></div>
              <div>
                <p className="eyebrow">{activeNav === 'Đã thích' ? 'Bộ sưu tập yêu thích' : 'Không gian của riêng bạn'}</p>
                <h1>{activeNav === 'Đã thích' ? 'Những bài hát đã thích' : 'Thư viện của bạn'}</h1>
                <p>{activeNav === 'Đã thích' ? `${songs.filter((song) => song.liked).length} bài hát bạn muốn nghe lại thật nhiều lần.` : `${albums.length} album · ${songs.filter((song) => song.uploaded).length} bài hát đã tải lên`}</p>
              </div>
            </div>

            {activeNav === 'Thư viện' && <>
              <div className="library-tabs"><button className="active">Tất cả</button><button>Album</button><button>Bài hát</button><button>Nghệ sĩ</button></div>
              <div className="section-heading"><div><p className="eyebrow">Bộ sưu tập</p><h2>Album của bạn</h2></div><button className="view-all" onClick={() => setAlbumOpen(true)}><Icon name="plus" size={15} /> Tạo album</button></div>
              <div className="album-grid library-albums">
                <button className="create-album-card" onClick={() => setAlbumOpen(true)}><span><Icon name="plus" size={24} /></span><strong>Album mới</strong><small>Tạo bộ sưu tập của riêng bạn</small></button>
                {albums.map((album) => (
                  <div className="album-card managed-album" key={album.id}>
                    <span className="album-cover"><img src={album.cover} alt="" /><span className="album-play"><Icon name="play" size={18} fill /></span></span>
                    <strong>{album.title}</strong>
                    <small>{album.count} bài hát · {album.description}</small>
                    <div className="album-manage-actions">
                      <button onClick={() => openAlbumEditor(album)} aria-label={`Sửa ${album.title}`}><Icon name="edit" size={14} /> Sửa</button>
                      <button className="danger-action" onClick={() => deleteAlbum(album.id)} aria-label={`Xóa ${album.title}`}><Icon name="trash" size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>}

            <div className="collection-songs">
              <div className="section-heading"><div><p className="eyebrow">{activeNav === 'Đã thích' ? 'Đã lưu' : 'File của bạn'}</p><h2>{activeNav === 'Đã thích' ? 'Tất cả bài hát' : 'Nhạc đã tải lên'}</h2></div></div>
              <div className="compact-song-list">
                {displayedSongs.length ? displayedSongs.map((song, index) => (
                  <div className={`compact-song ${song.id === currentId ? 'current' : ''}`} key={song.id}>
                    <button className="compact-play" onClick={() => chooseSong(song.id)}><img src={song.cover} alt="" /><span><Icon name={song.id === currentId && playing ? 'pause' : 'play'} size={16} fill /></span></button>
                    <div className="compact-info"><strong>{song.title}</strong><small>{song.artist} · {song.album}</small></div>
                    <span className="compact-index">{(index + 1).toString().padStart(2, '0')}</span>
                    <span className="compact-duration">{formatTime(song.duration)}</span>
                    <button className={song.liked ? 'liked' : ''} onClick={() => toggleLike(song.id)}><Icon name="heart" size={17} fill={song.liked} /></button>
                    {song.uploaded && userRole === 'admin' ? <div className="item-menu-wrap">
                      <button onClick={() => setSongMenuId(songMenuId === song.id ? null : song.id)} aria-label="Quản lý bài hát"><Icon name="more" size={18} /></button>
                      {songMenuId === song.id && <div className="item-action-menu">
                        <button onClick={() => openSongEditor(song)}><Icon name="edit" size={14} /> Sửa thông tin</button>
                        <button className="danger-action" onClick={() => deleteSong(song.id)}><Icon name="trash" size={14} /> Xóa bài hát</button>
                      </div>}
                    </div> : <button><Icon name="more" size={18} /></button>}
                  </div>
                )) : <div className="empty-state"><span><Icon name={activeNav === 'Đã thích' ? 'heart' : 'upload'} size={26} /></span><h3>{activeNav === 'Đã thích' ? 'Chưa có bài hát yêu thích' : 'Chưa có nhạc tải lên'}</h3><p>{activeNav === 'Đã thích' ? 'Nhấn biểu tượng trái tim ở một bài hát để lưu vào đây.' : 'Bạn có thể tải nhạc lên từ trang Hồ sơ cá nhân.'}</p>{activeNav === 'Thư viện' && <button onClick={() => setActiveNav('Hồ sơ')}>Đi đến hồ sơ</button>}</div>}
              </div>
            </div>
          </section>
        ) : (
          <section className="profile-page">
            <div className="profile-cover">
              <img src={images.tunnel} alt="" />
              <div className="profile-cover-shade" />
              <button><Icon name="camera" size={16} /> Đổi ảnh bìa</button>
            </div>
            <div className="profile-header">
              <div className="profile-avatar-large">
                <span aria-label={`Ảnh đại diện của ${userName || accountEmail}`}>{(userName || accountEmail || 'U').slice(0, 1).toUpperCase()}</span>
              </div>
              <div className="profile-identity">
                <span>Hồ sơ cá nhân</span>
                <h1>{userName || accountEmail || 'Tài khoản'}</h1>
                <p>{accountEmail ? `@${accountEmail.split('@')[0]}` : 'Tài khoản cá nhân'}{accountCreatedAt ? ` · Tham gia ${new Date(accountCreatedAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}` : ''}</p>
              </div>
              <button className="logout-button" onClick={async () => { await supabase.auth.signOut(); setPlaying(false) }}>Đăng xuất</button>
            </div>
            <div className="profile-stats">
              <div><strong>{albums.length}</strong><span>Album</span></div>
              <div><strong>{songs.filter((song) => song.liked).length}</strong><span>Bài đã thích</span></div>
              <div><strong>{songs.filter((song) => song.uploaded).length}</strong><span>Đã tải lên</span></div>
            </div>
            <div className="profile-actions-stack">
              {userRole === 'admin' && <button className="profile-upload-banner" onClick={() => loggedIn && setUploadOpen(true)}>
                <span className="profile-upload-icon"><Icon name="upload" size={23} /></span>
                <span><strong>Tải nhạc của bạn lên</strong><small>Thêm file MP3, WAV hoặc M4A vào thư viện cá nhân</small></span>
                <span className="profile-upload-action">Chọn file <Icon name="chevron" size={15} /></span>
              </button>}
            </div>
            <div className="profile-layout">
              <div className="profile-form-card">
                <div className="profile-card-heading">
                  <div><Icon name="user" size={18} /><span><strong>Thông tin cá nhân</strong><small>Cập nhật cách bạn xuất hiện trên VIBRA</small></span></div>
                  {profileSaved && <span className="saved-badge"><Icon name="check" size={13} /> Đã lưu</span>}
                </div>
                <div className="profile-form-grid">
                  <label>Họ và tên<input value={userName} onChange={(event) => { setUserName(event.target.value); setProfileSaved(false) }} /></label>
                  <label>Tên người dùng<input value={accountEmail.split('@')[0]} readOnly /></label>
                  <label className="full-field">Giới thiệu<textarea value={profileBio} onChange={(event) => { setProfileBio(event.target.value); setProfileSaved(false) }} maxLength={140} /><small>{profileBio.length}/140</small></label>
                  <label>Email<input type="email" value={accountEmail} readOnly /></label>
                </div>
                <div className="profile-form-footer"><button onClick={saveProfile}>Lưu thay đổi</button></div>
              </div>
            </div>
          </section>
        )}
      </main>

      {current && <footer className="player">
        {current.mediaType === 'video'
          ? <video ref={videoRef} className="audio-only-video" src={current.audio} playsInline preload="metadata" onTimeUpdate={onTimeUpdate} onEnded={() => skip(1)} />
          : <audio ref={audioRef} src={current.audio} onTimeUpdate={onTimeUpdate} onEnded={() => skip(1)} />}
        <div className="now-playing">
          <img src={current.cover} alt={`Bìa bài hát ${current.title}`} />
          <div><strong>{current.title}</strong><span>{current.artist}</span></div>
          <button onClick={() => toggleLike(current.id)} className={current.liked ? 'liked' : ''} aria-label="Yêu thích"><Icon name="heart" size={18} fill={current.liked} /></button>
        </div>
        <div className="player-center">
          <div className="player-controls">
            <button aria-label="Phát ngẫu nhiên"><Icon name="shuffle" size={17} /></button>
            <button onClick={() => skip(-1)} aria-label="Bài trước"><Icon name="previous" size={19} fill /></button>
            <button className="main-play" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Tạm dừng' : 'Phát'}>
              <Icon name={playing ? 'pause' : 'play'} size={20} fill />
            </button>
            <button onClick={() => skip(1)} aria-label="Bài tiếp theo"><Icon name="next" size={19} fill /></button>
            <button aria-label="Lặp lại"><Icon name="repeat" size={17} /></button>
          </div>
          <div className="timeline">
            <span>{formatTime((progress / 100) * (playbackMedia?.duration || current.duration))}</span>
            <input type="range" min="0" max="100" value={progress} onChange={(event) => seek(Number(event.target.value))} aria-label="Tiến trình phát" style={{ '--value': `${progress}%` } as React.CSSProperties} />
            <span>{formatTime(playbackMedia?.duration || current.duration)}</span>
          </div>
        </div>
        <div className="volume-control">
          <Icon name="volume" size={19} />
          <input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} aria-label="Âm lượng" style={{ '--value': `${volume}%` } as React.CSSProperties} />
          <button aria-label="Danh sách phát"><Icon name="library" size={19} /></button>
        </div>
      </footer>}

      {loggedIn && userRole === 'admin' && uploadOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeUpload()}>
          <div className="upload-modal" role="dialog" aria-modal="true" aria-labelledby="upload-title">
            <button className="modal-close" onClick={closeUpload} aria-label="Đóng"><Icon name="x" size={20} /></button>
            {uploadStep === 'pick' && <>
              <div className="modal-kicker">Thư viện của bạn</div>
              <h2 id="upload-title">Tải nhạc lên VIBRA</h2>
              <p>Tải file âm thanh hoặc video có âm thanh. Ảnh bìa sẽ tự lấy từ frame đầu của video.</p>
              <label className={`drop-zone ${dragging ? 'dragging' : ''} ${uploadFile ? 'has-file' : ''}`} onDragOver={(event: DragEvent) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event: DragEvent) => { event.preventDefault(); setDragging(false); processFile(event.dataTransfer.files[0]) }}>
                <input type="file" accept=".mp3,audio/*,video/mp4,video/x-m4v,video/quicktime,video/webm,.mp4,.m4v,.mov,.webm" onChange={(event: ChangeEvent<HTMLInputElement>) => processFile(event.target.files?.[0])} />
                <span className="upload-icon"><Icon name={extractingCover ? 'camera' : uploadFile ? 'check' : 'upload'} size={25} /></span>
                <strong>{uploadFile ? uploadFile.name : 'Kéo thả file vào đây'}</strong>
                <small>{extractingCover ? 'Đang tạo ảnh bìa từ video...' : uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB · Nhấn để đổi file` : 'Chọn MP3, WAV, M4A hoặc video MP4, MOV, WEBM'}</small>
              </label>
              {statusMessage && <p className="upload-error" role="alert">{statusMessage}</p>}
              <label className={`early-cover-upload ${uploadFile && isVideoFile(uploadFile) ? 'video-cover-ready' : ''}`}>
                <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" onChange={(event) => processCover(event.target.files?.[0])} />
                <span className="early-cover-preview">
                  {uploadCover ? <img src={uploadCover} alt="Ảnh bìa đã chọn" /> : <Icon name="camera" size={19} />}
                </span>
                <span><strong>{extractingCover ? 'Đang lấy ảnh bìa...' : uploadCover ? uploadCoverIsVideo ? 'Ảnh bìa từ video' : 'Đã chọn ảnh bìa' : 'Ảnh bìa không bắt buộc'}</strong><small>Chọn ảnh hoặc video · Video sẽ lấy frame đầu</small></span>
                <span className="early-cover-action">{uploadCover ? 'Đổi ảnh' : 'Chọn ảnh'} <Icon name="chevron" size={14} /></span>
              </label>
              <div className="upload-note"><Icon name="check" size={16} /> File được lưu riêng trong thư viện của bạn</div>
              <button className="modal-submit upload-continue" onClick={() => setUploadStep('details')} disabled={!uploadFile || extractingCover}>Tiếp tục <Icon name="chevron" size={16} /></button>
            </>}
            {uploadStep === 'details' && <>
              <div className="modal-kicker">Bước 2 / 2</div>
              <h2 id="upload-title">Thông tin bài hát</h2>
              {statusMessage && <p className="upload-error" role="alert">{statusMessage}</p>}
              {uploading && <div className="upload-progress" role="status" aria-live="polite">
                <div><span>{uploadStatus}</span>{uploadProgress !== null && <strong>{uploadProgress}%</strong>}</div>
                <span className={`upload-progress-track ${uploadProgress === null ? 'indeterminate' : ''}`}>
                  <i style={uploadProgress === null ? undefined : { width: `${uploadProgress}%` }} />
                </span>
              </div>}
              <div className="file-preview">
                <span><Icon name="music" size={22} /></span>
                <div><strong>{uploadFile?.name}</strong><small>{uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB` : ''}</small></div>
                <button onClick={() => setUploadStep('pick')}>Đổi file</button>
              </div>
              <div className="song-cover-field">
                <div className="song-cover-preview">
                  {uploadCover ? <img src={uploadCover} alt="Ảnh bìa đã chọn" /> : <Icon name="music" size={25} />}
                </div>
                <div>
                  <strong>Ảnh bìa bài hát</strong>
                  <small>{uploadCoverIsVideo ? 'Ảnh được lấy từ frame đầu video' : 'Ảnh hoặc video đều được · Không bắt buộc'}</small>
                  <label className="cover-upload-button">
                    <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" onChange={(event) => processCover(event.target.files?.[0])} />
                    <Icon name="camera" size={14} /> {uploadCover ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'}
                  </label>
                </div>
              </div>
              <label className="field-label">Tên bài hát<input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} autoFocus /></label>
              <label className="field-label">Nghệ sĩ<input value={uploadArtist} onChange={(event) => setUploadArtist(event.target.value)} placeholder="Tên nghệ sĩ" /></label>
              <button className="modal-submit" onClick={saveUpload} disabled={!uploadTitle.trim() || uploading}><Icon name="upload" size={18} /> {uploading ? 'Đang tải lên...' : 'Thêm vào thư viện'}</button>
            </>}
            {uploadStep === 'done' && <>
              <div className="success-icon"><Icon name="check" size={30} /></div>
              <h2 id="upload-title">Đã thêm bài hát!</h2>
              <p>“{uploadTitle}” đã nằm trong mục Thư viện → Nhạc đã tải lên.</p>
              <div className="upload-success-actions">
                <button onClick={() => { setPlaying(true); closeUpload() }}><Icon name="play" size={16} fill /> Nghe ngay</button>
                <button onClick={() => { setActiveNav('Thư viện'); closeUpload() }}><Icon name="library" size={16} /> Xem trong Thư viện</button>
              </div>
            </>}
          </div>
        </div>
      )}

      {albumOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setAlbumOpen(false)
            setEditingAlbumId(null)
            setAlbumTitle('')
            setAlbumDescription('')
          }
        }}>
          <form className="upload-modal album-modal" role="dialog" aria-modal="true" aria-labelledby="album-title" onSubmit={createAlbum}>
            <button type="button" className="modal-close" onClick={() => { setAlbumOpen(false); setEditingAlbumId(null); setAlbumTitle(''); setAlbumDescription('') }} aria-label="Đóng"><Icon name="x" size={20} /></button>
            <div className="modal-kicker">Bộ sưu tập cá nhân</div>
            <h2 id="album-title">{editingAlbumId ? 'Chỉnh sửa album' : 'Tạo album mới'}</h2>
            <p>{editingAlbumId ? 'Cập nhật tên, mô tả hoặc ảnh bìa cho bộ sưu tập.' : 'Gom những bài hát yêu thích vào một không gian mang dấu ấn riêng của bạn.'}</p>
            <div className="album-cover-picker">
              <div className="selected-cover"><img src={albumCover} alt="Ảnh bìa album đã chọn" /><span><Icon name="music" size={25} /></span></div>
              <div>
                <strong>Chọn ảnh bìa</strong>
                <div className="cover-options">
                  {[images.blue, images.neon, images.red, images.glow, images.mono].map((cover) => (
                    <button type="button" key={cover} className={albumCover === cover ? 'selected' : ''} onClick={() => setAlbumCover(cover)}>
                      <img src={cover} alt="" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <label className="field-label">Tên album<input required autoFocus value={albumTitle} onChange={(event) => setAlbumTitle(event.target.value)} placeholder="Ví dụ: Những ngày đầy nắng" /></label>
            <label className="field-label">Mô tả <span className="optional">(không bắt buộc)</span><input value={albumDescription} onChange={(event) => setAlbumDescription(event.target.value)} placeholder="Album này mang cảm giác gì?" /></label>
            <button className="modal-submit" type="submit" disabled={!albumTitle.trim()}><Icon name={editingAlbumId ? 'check' : 'plus'} size={18} /> {editingAlbumId ? 'Lưu thay đổi' : 'Tạo album'}</button>
          </form>
        </div>
      )}

      {editingSongId && (
        <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setEditingSongId(null)}>
          <form className="upload-modal song-edit-modal" role="dialog" aria-modal="true" aria-labelledby="song-edit-title" onSubmit={saveSongEdit}>
            <button type="button" className="modal-close" onClick={() => setEditingSongId(null)} aria-label="Đóng"><Icon name="x" size={20} /></button>
            <div className="modal-kicker">Nhạc đã tải lên</div>
            <h2 id="song-edit-title">Chỉnh sửa bài hát</h2>
            <p>Thay đổi thông tin hiển thị hoặc ảnh bìa của bài hát.</p>
            <div className="song-edit-cover">
              <img src={editSongCover} alt="Ảnh bìa bài hát" />
              <label><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setEditSongCoverFile(file)
                const reader = new FileReader()
                reader.onload = () => typeof reader.result === 'string' && setEditSongCover(reader.result)
                reader.readAsDataURL(file)
              }} /><Icon name="camera" size={15} /> Đổi ảnh bìa</label>
            </div>
            <label className="field-label">Tên bài hát<input required value={editSongTitle} onChange={(event) => setEditSongTitle(event.target.value)} /></label>
            <label className="field-label">Nghệ sĩ<input value={editSongArtist} onChange={(event) => setEditSongArtist(event.target.value)} /></label>
            <button className="modal-submit" type="submit"><Icon name="check" size={17} /> Lưu thay đổi</button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
