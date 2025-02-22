import { useState, useEffect, useCallback, memo } from 'react'
import { Button } from "/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "/components/ui/card"
import { Input } from "/components/ui/input"
import { Trash, Edit, Plus, X, MessageCircle, Sun, Moon, Eye, EyeOff, User, Save, ChevronDown, ChevronUp } from "lucide-react"
import { motion } from "framer-motion"

interface Message {
  id: number
  username: string
  avatarUrl: string
  message: string
  backgroundColor: string
  replies: Reply[]
}

interface Reply {
  id: number
  username: string
  avatarUrl: string
  message: string
  backgroundColor: string
}

interface Profile {
  username: string
  avatarUrl: string
  backgroundColor: string
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
      return JSON.parse(cookieValue)
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
      return JSON.parse(cookieValue)
    } catch (e) {
      console.error('Error parsing profile cookie data:', e)
    }
  }
  return { username: '', avatarUrl: '', backgroundColor: '#ffffff' }
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
      return JSON.parse(cookieValue)
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
  return (
    <div key={message.id} className="flex items-start">
      <div
        className="avatar bg-cover bg-center rounded-full w-20 h-20 mr-4"
        style={{ backgroundImage: `url(${message.avatarUrl || 'https://picsum.photos/100?random=' + message.id})` }}
      />
      <div className="flex-1">
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
            className="speech-bubble p-2 rounded mb-2"
            style={{
              backgroundColor: message.backgroundColor,
              color: getContrastingColor(message.backgroundColor),
            }}
          >
            <strong>{message.username}:</strong> {message.message}
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
        {message.replies.length > 0 && <div className="mt-4"></div>}
        {message.replies.map((reply) => (
          <div key={reply.id} className="flex items-start mt-2 pl-10">
            <div className="flex-1">
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
                  className="reply-speech-bubble p-2 rounded text-right"
                  style={{
                    backgroundColor: reply.backgroundColor,
                    color: getContrastingColor(reply.backgroundColor),
                  }}
                >
                  <strong>{reply.username}:</strong> {reply.message}
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
                </div>
              )}
            </div>
            <div
              className="avatar bg-cover bg-center rounded-full w-12 h-12 ml-4"
              style={{ backgroundImage: `url(${reply.avatarUrl || 'https://picsum.photos/100?random=' + reply.id})` }}
            />
          </div>
        ))}
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
      </div>
    </div>
  )
})

export default function CharacterTalker() {
  const [messages, setMessages] = useState<Message[]>(loadMessagesFromCookie())
  const [username, setUsername] = useState(loadProfileFromCookie().username)
  const [avatarUrl, setAvatarUrl] = useState(loadProfileFromCookie().avatarUrl)
  const [backgroundColor, setBackgroundColor] = useState(loadProfileFromCookie().backgroundColor)
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

  useEffect(() => {
    saveMessagesToCookie(messages)
  }, [messages])

  useEffect(() => {
    saveProfileToCookie({ username, avatarUrl, backgroundColor })
  }, [username, avatarUrl, backgroundColor])

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

  const updateProfile = useCallback(() => {
    // No need to do anything here as state is already updated
  }, [])

  const addMessage = useCallback(() => {
    if (newMessage.trim()) {
      const messageObj: Message = {
        id: Date.now(),
        username,
        avatarUrl,
        message: newMessage,
        backgroundColor,
        replies: [],
      }
      setMessages([...messages, messageObj])
      setNewMessage('')
    }
  }, [newMessage, username, avatarUrl, backgroundColor, messages])

  const deleteMessage = useCallback((id: number) => {
    const updatedMessages = messages.filter((msg) => msg.id !== id)
    setMessages(updatedMessages)
  }, [messages])

  const editMessage = useCallback((id: number, newMessage: string) => {
    const updatedMessages = messages.map((msg) =>
      msg.id === id ? { ...msg, message: newMessage } : msg
    )
    setMessages(updatedMessages)
    setEditingMessageId(null)
    setEditingMessageText('')
  }, [messages])

  const addReply = useCallback((messageId: number, replyMessage: string) => {
    const updatedMessages = messages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            replies: [
              ...msg.replies,
              {
                id: Date.now(),
                username,
                avatarUrl,
                message: replyMessage,
                backgroundColor: backgroundColor, // Use the original background color directly
              },
            ],
          }
        : msg
    )
    setMessages(updatedMessages)
    setReplyMessage('')
    setReplyingToMessageId(null)
  }, [messages, username, avatarUrl, backgroundColor])

  const deleteReply = useCallback((messageId: number, replyId: number) => {
    const updatedMessages = messages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            replies: msg.replies.filter((reply) => reply.id !== replyId),
          }
        : msg
    )
    setMessages(updatedMessages)
  }, [messages])

  const editReply = useCallback((messageId: number, replyId: number, newReplyMessage: string) => {
    const updatedMessages = messages.map((msg) =>
      msg.id === messageId
        ? {
            ...msg,
            replies: msg.replies.map((reply) =>
              reply.id === replyId ? { ...reply, message: newReplyMessage } : reply
            ),
          }
        : msg
    )
    setMessages(updatedMessages)
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
    const newAlias: Profile = { username, avatarUrl, backgroundColor }
    setAliases([...aliases, newAlias])
  }, [username, avatarUrl, backgroundColor, aliases])

  const switchAlias = useCallback((alias: Profile) => {
    setUsername(alias.username)
    setAvatarUrl(alias.avatarUrl)
    setBackgroundColor(alias.backgroundColor)
    setIsProfileUpdated(true)
    setTimeout(() => setIsProfileUpdated(false), 500) // Reset animation after 500ms
  }, [])

  const deleteAlias = useCallback((index: number) => {
    const updatedAliases = aliases.filter((_, i) => i !== index)
    setAliases(updatedAliases)
  }, [aliases])

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
                        className="avatar bg-cover bg-center rounded-full w-8 h-8"
                        style={{ backgroundImage: `url(${alias.avatarUrl || 'https://picsum.photos/100?random=' + index})` }}
                      />
                      <div>
                        <strong>{alias.username}</strong>
                        <div className="text-sm">
                          <span className="inline-block w-4 h-4" style={{ backgroundColor: alias.backgroundColor }} />
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
          <div className="flex space-x-2 mb-2">
            <motion.div
              className="flex-1"
              animate={{ backgroundColor: isProfileUpdated ? "#ffeb3b" : "transparent" }}
              transition={{ duration: 0.3, ease: "easeInOut", repeat: 1, repeatType: "reverse" }}
            >
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
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
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className={`w-full ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
              />
            </motion.div>
            <Button onClick={updateProfile} className="w-24 text-sm">
              Update Profile
            </Button>
          </div>
        </div>
        <div className="mt-4">
          <Input
            type="text"
            placeholder="Message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className={`w-full mb-2 ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-black'} h-16`}
          />
          <Button onClick={addMessage} className="w-full">
            Submit
          </Button>
        </div>
        <div className="space-y-4 mt-6">
          {messages.map((message) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

