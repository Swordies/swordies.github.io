import { useState, useEffect, useCallback, memo, useRef } from 'react'
import { Button } from "/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "/components/ui/card"
import { Input } from "/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash, Edit, Plus, X, MessageCircle, Sun, Moon, Eye, EyeOff, User, Save, ChevronDown, ChevronUp, EmojiHappy } from "lucide-react"
import { motion } from "framer-motion"
import { formatDistanceToNow, format } from 'date-fns'
import './App.css'

interface Message {
  id: number
  username: string
  avatarUrl: string
  message: string
  backgroundColor: string
  emoji: string
  replies: Reply[]
  borderColor: string
  borderStyle: string
  borderWidth: string
  usernameBoxColor: string
  font: string
  createdAt: Date
}

interface Reply {
  id: number
  username: string
  avatarUrl: string
  message: string
  backgroundColor: string
  emoji: string
  borderColor: string
  borderStyle: string
  borderWidth: string
  usernameBoxColor: string
  font: string
  createdAt: Date
}

interface Profile {
  username: string
  avatarUrl: string
  backgroundColor: string
  emoji: string
  borderColor: string
  borderStyle: string
  borderWidth: string
  usernameBoxColor: string
  font: string
}

const cookieName = 'bbs_messages'
const profileCookieName = 'bbs_profile'
const themeCookieName = 'bbs_theme'
const buttonVisibilityCookieName = 'bbs_button_visibility'
const aliasesCookieName = 'bbs_aliases'

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

const setCookie = (name: string, value: any) => {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${JSON.stringify(value)}; expires=${expires}; path=/`
}

const loadMessagesFromCookie = (): Message[] => {
  const cookieValue = getCookie(cookieName)
  if (cookieValue) {
    try {
      const messages = JSON.parse(cookieValue)
      return messages.map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        replies: msg.replies.map((reply: any) => ({
          ...reply,
          createdAt: new Date(reply.createdAt),
        })),
      })).filter((msg: Message) => msg.createdAt instanceof Date && !isNaN(msg.createdAt.getTime()))
    } catch (e) {
      console.error('Error parsing cookie data:', e)
    }
  }
  return []
}

const loadProfileFromCookie = (): Profile => {
  const cookieValue = getCookie(profileCookieName)
  if (cookieValue) {
    try {
      const profile = JSON.parse(cookieValue)
      return {
        username: profile.username || '',
        avatarUrl: profile.avatarUrl || '',
        backgroundColor: profile.backgroundColor || '#ffffff',
        emoji: profile.emoji || '',
        borderColor: profile.borderColor || '#000000',
        borderStyle: profile.borderStyle || 'solid',
        borderWidth: profile.borderWidth || '2px',
        usernameBoxColor: profile.usernameBoxColor || '#ffffff',
        font: profile.font || 'Arial',
      }
    } catch (e) {
      console.error('Error parsing profile cookie data:', e)
    }
  }
  return { username: '', avatarUrl: '', backgroundColor: '#ffffff', emoji: '', borderColor: '#000000', borderStyle: 'solid', borderWidth: '2px', usernameBoxColor: '#ffffff', font: 'Arial' }
}

const loadThemeFromCookie = (): string => {
  const cookieValue = getCookie(themeCookieName)
  return cookieValue || 'light'
}

const loadButtonVisibilityFromCookie = (): boolean => {
  const cookieValue = getCookie(buttonVisibilityCookieName)
  return cookieValue === 'true'
}

const loadAliasesFromCookie = (): Profile[] => {
  const cookieValue = getCookie(aliasesCookieName)
  if (cookieValue) {
    try {
      const aliases = JSON.parse(cookieValue)
      return aliases.map((alias: Profile) => ({
        username: alias.username || '',
        avatarUrl: alias.avatarUrl || '',
        backgroundColor: alias.backgroundColor || '#ffffff',
        emoji: alias.emoji || '',
        borderColor: alias.borderColor || '#000000',
        borderStyle: alias.borderStyle || 'solid',
        borderWidth: alias.borderWidth || '2px',
        usernameBoxColor: alias.usernameBoxColor || '#ffffff',
        font: alias.font || 'Arial',
      }))
    } catch (e) {
      console.error('Error parsing aliases cookie data:', e)
    }
  }
  return []
}

const saveMessagesToCookie = (messages: Message[]) => {
  setCookie(cookieName, messages)
}

const saveProfileToCookie = (profile: Profile) => {
  setCookie(profileCookieName, profile)
}

const saveThemeToCookie = (theme: string) => {
  setCookie(themeCookieName, theme)
}

const saveButtonVisibilityToCookie = (isVisible: boolean) => {
  setCookie(buttonVisibilityCookieName, isVisible)
}

const saveAliasesToCookie = (aliases: Profile[]) => {
  setCookie(aliasesCookieName, aliases)
}

const getContrastingColor = (hexColor: string): string => {
  const color = hexToRgb(hexColor)
  if (!color) {
    return '#000000' // Default to black if color is null
  }
  const luminance = (0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

const MessageItem = memo(({ message, editingMessageId, editingMessageText, setEditingMessageId, setEditingMessageText, editMessage, deleteMessage, theme, areButtonsVisible, setReplyingToMessageId, replyMessage, setReplyMessage, addReply, editingReplyId, editingReplyText, setEditingReplyId, setEditingReplyText, editReply, deleteReply, replyingToMessageId }: {
  message: Message
  editingMessageId: number | null
  editingMessageText: string
  setEditingMessageId: (id: number | null) => void
  setEditingMessageText: (text: string) => void
  editMessage: (id: number, newMessage: string) => void
  deleteMessage: (id: number) => void
  theme: string
  areButtonsVisible: boolean
  setReplyingToMessageId: (id: number | null) => void
  replyMessage: string
  setReplyMessage: (message: string) => void
  addReply: (messageId: number, replyMessage: string) => void
  editingReplyId: number | null
  editingReplyText: string
  setEditingReplyId: (id: number | null) => void
  setEditingReplyText: (text: string) => void
  editReply: (messageId: number, replyId: number, newReplyMessage: string) => void
  deleteReply: (messageId: number, replyId: number) => void
  replyingToMessageId: number | null
}) => {
  const formattedDate = (date: Date) => {
    const now = new Date()
    const diffInDays = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    if (diffInDays > 7) {
      return format(date, 'yyyy-MM-dd HH:mm')
    } else {
      return formatDistanceToNow(date, { addSuffix: true })
    }
  }

  return (
    <div key={message.id} className="flex items-start mb-4">
      <div className="relative mr-4">
        <div
          className={`bg-cover bg-center rounded-full w-20 h-20 border-2 border-${message.borderColor}`}
          style={{ backgroundImage: `url(${message.avatarUrl || 'https://picsum.photos/100?random=' + message.id})` }}
        />
        {message.emoji && (
          <div className="absolute bottom-0 right-0 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xl shadow-md">
            {message.emoji}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <div
            className={`inline-block px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-black'}`}
            style={{ backgroundColor: message.usernameBoxColor, color: getContrastingColor(message.usernameBoxColor), fontFamily: message.font }}
          >
            <strong>{message.username}</strong>
          </div>
          <div className="ml-2 text-sm text-gray-500">
            {formattedDate(message.createdAt)}
          </div>
        </div>
        {editingMessageId === message.id ? (
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              value={editingMessageText}
              onChange={(e) => setEditingMessageText(e.target.value)}
              className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
            />
            <Button variant="secondary" size="icon" className="w-5 h-5 p-0" onClick={() => {
              editMessage(message.id, editingMessageText)
            }}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div
            className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
            style={{ backgroundColor: message.backgroundColor, color: getContrastingColor(message.backgroundColor), fontFamily: message.font }}
          >
            {message.message}
          </div>
        )}
        {areButtonsVisible && (
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={() => {
              setEditingMessageId(message.id)
              setEditingMessageText(message.message)
            }}>
              <Edit className="w-3 h-3" />
            </Button>
            <Button variant="destructive" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-red-700 text-white' : ''}`} onClick={() => deleteMessage(message.id)}>
              <Trash className="w-3 h-3" />
            </Button>
            <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={() => setReplyingToMessageId(message.id)}>
              <MessageCircle className="w-3 h-3" />
            </Button>
          </div>
        )}
        {replyingToMessageId === message.id && (
          <div className="flex items-center space-x-2 mt-2">
            <Input
              type="text"
              placeholder="Reply message"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
            />
            <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={() => addReply(message.id, replyMessage)}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={() => setReplyingToMessageId(null)}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        {message.replies.length > 0 && <div className="mt-4"></div>}
        {message.replies.map((reply) => (
          <div key={reply.id} className="flex items-start mt-2 pl-10">
            <div className="flex-1">
              <div className="flex items-center justify-end mb-2">
                <div
                  className={`inline-block px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-black'}`}
                  style={{ backgroundColor: reply.usernameBoxColor, color: getContrastingColor(reply.usernameBoxColor), fontFamily: reply.font }}
                >
                  <strong>{reply.username}</strong>
                </div>
                <div className="ml-2 text-sm text-gray-500">
                  {formattedDate(reply.createdAt)}
                </div>
              </div>
              {editingReplyId === reply.id ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={editingReplyText}
                    onChange={(e) => setEditingReplyText(e.target.value)}
                    className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                  />
                  <Button variant="secondary" size="icon" className="w-5 h-5 p-0" onClick={() => {
                    editReply(message.id, reply.id, editingReplyText)
                  }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-black'}`}
                  style={{ backgroundColor: reply.backgroundColor, color: getContrastingColor(reply.backgroundColor), fontFamily: reply.font }}
                >
                  {reply.message}
                </div>
              )}
              {areButtonsVisible && (
                <div className="flex items-end justify-end space-x-2 mt-1">
                  <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={() => {
                    setEditingReplyId(reply.id)
                    setEditingReplyText(reply.message)
                  }}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="destructive" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-red-700 text-white' : ''}`} onClick={() => deleteReply(message.id, reply.id)}>
                    <Trash className="w-3 h-3" />
                  </Button>
                  <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={() => setReplyingToMessageId(reply.id)}>
                    <MessageCircle className="w-3 h-3" />
                  </Button>
                </div>
              )}
              {replyingToMessageId === reply.id && (
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    type="text"
                    placeholder="Reply message"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                  />
                  <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={() => addReply(message.id, replyMessage)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={() => setReplyingToMessageId(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            <div className="relative ml-4">
              <div
                className={`bg-cover bg-center rounded-full w-20 h-20 border-2 border-${reply.borderColor}`}
                style={{ backgroundImage: `url(${reply.avatarUrl || 'https://picsum.photos/100?random=' + reply.id})` }}
              />
              {reply.emoji && (
                <div className="absolute bottom-0 left-0 bg-white rounded-full w-6 h-6 flex items-center justify-center text-xl shadow-md">
                  {reply.emoji}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

const availableEmojis = ['😊', '😢', '🤔', '👍', '👎', '😂', '😍', '😎', '😱', '🥳']
const availableBorderStyles = ['solid', 'dashed', 'dotted']
const availableBorderWidths = ['1px', '2px', '3px', '4px', '5px']
const availableFonts = [
  'Arial',
  'Courier New',
  'Georgia',
  'Times New Roman',
  'Verdana',
  'Century Schoolbook',
  'Impact',
  'Comic Sans',
  'Papyrus',
  'Segoe Print',
  'monospace'
]

export default function BBS() {
  const [messages, setMessages] = useState<Message[]>(loadMessagesFromCookie())
  const [profile, setProfile] = useState<Profile>(loadProfileFromCookie())
  const [newMessage, setNewMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingMessageText, setEditingMessageText] = useState<string>('')
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null)
  const [editingReplyText, setEditingReplyText] = useState<string>('')
  const [replyMessage, setReplyMessage] = useState('')
  const [replyingToMessageId, setReplyingToMessageId] = useState<number | null>(null)
  const [theme, setTheme] = useState(loadThemeFromCookie())
  const [areButtonsVisible, setAreButtonsVisible] = useState(loadButtonVisibilityFromCookie())
  const [aliases, setAliases] = useState<Profile[]>(loadAliasesFromCookie())
  const [isAliasesVisible, setIsAliasesVisible] = useState(false)
  const [isProfileUpdated, setIsProfileUpdated] = useState(false)
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false)
  const [isFontPickerVisible, setIsFontPickerVisible] = useState(false)
  const [googleFontUrl, setGoogleFontUrl] = useState('')
  const fontPickerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    saveMessagesToCookie(messages)
  }, [messages])

  useEffect(() => {
    saveProfileToCookie(profile)
  }, [profile])

  useEffect(() => {
    document.documentElement.className = theme
  }, [theme])

  useEffect(() => {
    saveThemeToCookie(theme)
  }, [theme])

  useEffect(() => {
    saveButtonVisibilityToCookie(areButtonsVisible)
  }, [areButtonsVisible])

  useEffect(() => {
    saveAliasesToCookie(aliases)
  }, [aliases])

  useEffect(() => {
    if (googleFontUrl) {
      const link = document.createElement('link')
      link.href = googleFontUrl
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
  }, [googleFontUrl])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontPickerRef.current && !fontPickerRef.current.contains(event.target as Node)) {
        setIsFontPickerVisible(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const updateProfile = useCallback(() => {
    setIsProfileUpdated(true)
    setTimeout(() => setIsProfileUpdated(false), 500) // Reset animation after 500ms
  }, [])

  const addMessage = useCallback(() => {
    if (newMessage.trim()) {
      const messageObj: Message = {
        id: Date.now(),
        ...profile,
        message: newMessage,
        replies: [],
        createdAt: new Date(),
      }
      setMessages([...messages, messageObj])
      setNewMessage('')
    }
  }, [newMessage, messages, profile])

  const deleteMessage = useCallback((id: number) => {
    setMessages(messages.filter((msg) => msg.id !== id))
  }, [messages])

  const editMessage = useCallback((id: number, newMessage: string) => {
    setMessages(messages.map((msg) =>
      msg.id === id ? { ...msg, message: newMessage } : msg
    ))
    setEditingMessageId(null)
    setEditingMessageText('')
  }, [messages])

  const addReply = useCallback((messageId: number, replyMessage: string) => {
    setMessages(messages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            replies: [
              ...msg.replies,
              {
                id: Date.now(),
                ...profile,
                message: replyMessage,
                createdAt: new Date(),
              },
            ],
          }
        : msg
    ))
    setReplyMessage('')
    setReplyingToMessageId(null)
  }, [messages, profile])

  const deleteReply = useCallback((messageId: number, replyId: number) => {
    setMessages(messages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            replies: msg.replies.filter((reply) => reply.id !== replyId),
          }
        : msg
    ))
  }, [messages])

  const editReply = useCallback((messageId: number, replyId: number, newReplyMessage: string) => {
    setMessages(messages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            replies: msg.replies.map((reply) =>
              reply.id === replyId ? { ...reply, message: newReplyMessage } : reply
            ),
          }
        : msg
    ))
    setEditingReplyId(null)
    setEditingReplyText('')
  }, [messages])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme])

  const toggleButtonsVisibility = useCallback(() => {
    setAreButtonsVisible(!areButtonsVisible)
  }, [areButtonsVisible])

  const saveAlias = useCallback(() => {
    setAliases([...aliases, profile])
  }, [profile, aliases])

  const switchAlias = useCallback((alias: Profile) => {
    setProfile(alias)
    updateProfile()
  }, [updateProfile])

  const deleteAlias = useCallback((index: number) => {
    setAliases(aliases.filter((_, i) => i !== index))
  }, [aliases])

  const selectEmoji = useCallback((selectedEmoji: string) => {
    setProfile(prevProfile => ({ ...prevProfile, emoji: selectedEmoji }))
    setIsEmojiPickerVisible(false)
  }, [])

  const selectFont = useCallback((selectedFont: string) => {
    setProfile(prevProfile => ({ ...prevProfile, font: selectedFont }))
    setIsFontPickerVisible(false)
  }, [])

  const getBorderStylePreview = (style: string) => {
    switch (style) {
      case 'solid':
        return <div className="w-4 h-4 border-2 border-solid border-black"></div>
      case 'dashed':
        return <div className="w-4 h-4 border-2 border-dashed border-black"></div>
      case 'dotted':
        return <div className="w-4 h-4 border-2 border-dotted border-black"></div>
      default:
        return <div className="w-4 h-4 border-2 border-solid border-black"></div>
    }
  }

  return (
    <Card className={`w-full max-w-3xl mx-auto mt-10 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Character Talk</CardTitle>
        <div className="flex items-center space-x-2 mt-2">
          <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
          </Button>
          <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={toggleButtonsVisibility}>
            {areButtonsVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={() => setIsAliasesVisible(!isAliasesVisible)} className="w-full">
            {isAliasesVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Aliases
          </Button>
          {isAliasesVisible && (
            <div className="mt-2">
              <div className="grid grid-cols-3 gap-4">
                {aliases.map((alias, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`bg-cover bg-center rounded-full w-8 h-8 border-2 border-${alias.borderColor}`}
                        style={{ backgroundImage: `url(${alias.avatarUrl || 'https://picsum.photos/100?random=' + index})` }}
                      />
                      <div>
                        <strong>{alias.username}</strong>
                        <div className="text-sm">
                          <span className="inline-block w-4 h-4" style={{ backgroundColor: alias.backgroundColor }} />
                        </div>
                        <div className="text-sm">
                          <span className="inline-block px-1 py-0.5 rounded text-xs" style={{ backgroundColor: alias.usernameBoxColor, color: getContrastingColor(alias.usernameBoxColor), fontFamily: alias.font }}>
                            Username
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="secondary" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-gray-700 text-white' : ''}`} onClick={() => switchAlias(alias)}>
                        <User className="w-3 h-3" />
                      </Button>
                      <Button variant="destructive" size="icon" className={`w-5 h-5 p-0 ${theme === 'dark' ? 'bg-red-700 text-white' : ''}`} onClick={() => deleteAlias(index)}>
                        <Trash className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <Button variant="outline" onClick={saveAlias} className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}>
                  Save as Alias
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="mb-4">
          <div className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <Input
                  type="text"
                  placeholder="Username"
                  value={profile.username}
                  onChange={(e) => setProfile(prevProfile => ({ ...prevProfile, username: e.target.value }))}
                  className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                />
              </motion.div>
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <Input
                  type="text"
                  placeholder="Avatar URL"
                  value={profile.avatarUrl}
                  onChange={(e) => setProfile(prevProfile => ({ ...prevProfile, avatarUrl: e.target.value }))}
                  className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                />
              </motion.div>
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <Input
                  type="text"
                  placeholder="Background Color (Hex)"
                  value={profile.backgroundColor}
                  onChange={(e) => setProfile(prevProfile => ({ ...prevProfile, backgroundColor: e.target.value }))}
                  className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                />
              </motion.div>
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Emoji"
                    value={profile.emoji}
                    onChange={(e) => setProfile(prevProfile => ({ ...prevProfile, emoji: e.target.value }))}
                    className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                    onClick={() => setIsEmojiPickerVisible(!isEmojiPickerVisible)}
                  />
                  {isEmojiPickerVisible && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-md rounded-b-md z-10">
                      <div className="grid grid-cols-5 gap-2 p-2">
                        {availableEmojis.map((emojiOption) => (
                          <button
                            key={emojiOption}
                            className="w-8 h-8 flex items-center justify-center text-xl"
                            onClick={() => selectEmoji(emojiOption)}
                          >
                            {emojiOption}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            <div className="flex space-x-2">
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <Input
                  type="text"
                  placeholder="Border Color (Hex)"
                  value={profile.borderColor}
                  onChange={(e) => setProfile(prevProfile => ({ ...prevProfile, borderColor: e.target.value }))}
                  className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                />
              </motion.div>
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <Select value={profile.borderStyle} onValueChange={(value) => setProfile(prevProfile => ({ ...prevProfile, borderStyle: value }))}>
                  <SelectTrigger className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}>
                    <SelectValue placeholder="Border Style" />
                  </SelectTrigger>
                  <SelectContent className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                    {availableBorderStyles.map((style) => (
                      <SelectItem key={style} value={style} className="flex items-center space-x-2">
                        {getBorderStylePreview(style)}
                        <span className="text-sm">{style}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <Select value={profile.borderWidth} onValueChange={(value) => setProfile(prevProfile => ({ ...prevProfile, borderWidth: value }))}>
                  <SelectTrigger className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}>
                    <SelectValue placeholder="Border Width" />
                  </SelectTrigger>
                  <SelectContent className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                    {availableBorderWidths.map((width) => (
                      <SelectItem key={width} value={width} className="flex items-center space-x-2">
                        <span className="text-sm">{width}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <Input
                  type="text"
                  placeholder="Username Box Color (Hex)"
                  value={profile.usernameBoxColor}
                  onChange={(e) => setProfile(prevProfile => ({ ...prevProfile, usernameBoxColor: e.target.value }))}
                  className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                />
              </motion.div>
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <div className="relative" ref={fontPickerRef}>
                  <Input
                    type="text"
                    placeholder="Font"
                    value={profile.font}
                    onChange={(e) => setProfile(prevProfile => ({ ...prevProfile, font: e.target.value }))}
                    className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                    onClick={() => setIsFontPickerVisible(!isFontPickerVisible)}
                  />
                  {isFontPickerVisible && (
                    <div className="absolute top-full left-0 w-full shadow-md rounded-b-md z-10" style={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff' }}>
                      <div className="flex flex-col space-y-2 p-2">
                        {availableFonts.map((fontOption) => (
                          <div
                            key={fontOption}
                            className={`w-full text-center cursor-pointer p-2 hover:bg-gray-700 hover:text-white ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                            onClick={() => selectFont(fontOption)}
                            style={{ fontFamily: fontOption }}
                          >
                            {fontOption}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              <motion.div
                className="flex-1"
                animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
                transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
              >
                <Input
                  type="text"
                  placeholder="Google Font URL"
                  value={googleFontUrl}
                  onChange={(e) => setGoogleFontUrl(e.target.value)}
                  className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                />
              </motion.div>
              <Button onClick={updateProfile} className="w-24 text-sm">
                Update Profile
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Input
            type="text"
            placeholder="Message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className={`w-full mb-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
          />
          <Button onClick={addMessage} className="w-full">
            Submit
          </Button>
        </div>
        <div className="space-y-4 mt-6">
          {messages.length > 0 ? (
            messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                editingMessageId={editingMessageId}
                editingMessageText={editingMessageText}
                setEditingMessageId={setEditingMessageId}
                setEditingMessageText={setEditingMessageText}
                editMessage={editMessage}
                deleteMessage={deleteMessage}
                theme={theme}
                areButtonsVisible={areButtonsVisible}
                setReplyingToMessageId={setReplyingToMessageId}
                replyMessage={replyMessage}
                setReplyMessage={setReplyMessage}
                addReply={addReply}
                editingReplyId={editingReplyId}
                editingReplyText={editingReplyText}
                setEditingReplyId={setEditingReplyId}
                setEditingReplyText={setEditingReplyText}
                editReply={editReply}
                deleteReply={deleteReply}
                replyingToMessageId={replyingToMessageId}
              />
            ))
          ) : (
            <div className="text-center text-gray-500">No posts yet. Start the conversation!</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

