import { RepoBanner } from './repo-banner'
import { Button } from '@/components/ui/button'
import { ArrowUp, Paperclip, Square, X } from 'lucide-react'
import { SetStateAction, useMemo } from 'react'
import TextareaAutosize from 'react-textarea-autosize'

export function ChatInput({
  retry,
  isErrored,
  errorMessage,
  isLoading,
  stop,
  input,
  handleInputChange,
  handleSubmit,
  children,
}: {
  retry: () => void
  isErrored: boolean
  errorMessage: string
  isLoading: boolean
  stop: () => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  children: React.ReactNode
}) {
  function onEnter(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      if (e.currentTarget.checkValidity()) {
        handleSubmit(e)
      } else {
        e.currentTarget.reportValidity()
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={onEnter}
      className="mb-2 mt-auto flex flex-col bg-background"
    >
      {isErrored && (
        <div
          className={`flex items-center p-1.5 text-sm font-medium mb-2 rounded-xl bg-red-400/10 text-red-400`}
        >
          <span className="flex-1 px-1.5">
            {errorMessage}
          </span>
          <button
            className={`px-2 py-1 rounded-sm bg-red-400/20`}
            onClick={retry}
          >
            Try again
          </button>
        </div>
      )}
      <div className="relative">
        <RepoBanner className="absolute bottom-full inset-x-2 translate-y-1 z-0 pb-2" />
        <div className="shadow-md rounded-2xl border relative z-10 bg-background">
          <div className="flex items-center px-3 py-2 gap-1">{children}</div>
          <TextareaAutosize
            autoFocus={true}
            minRows={1}
            maxRows={5}
            className="text-normal px-3 resize-none ring-0 bg-inherit w-full m-0 outline-none"
            required={true}
            placeholder="Type your message here..."
            disabled={isLoading}
            value={input}
            onChange={handleInputChange}
          />
          <div className="flex p-3 gap-2 items-center justify-end">
            {!isLoading ? (
              <Button
                disabled={isErrored}
                variant="default"
                size="icon"
                type="submit"
                className="rounded-xl h-10 w-10"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="icon"
                className="rounded-xl h-10 w-10"
                onClick={(e) => {
                  e.preventDefault()
                  stop()
                }}
              >
                <Square className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Computer Use is an open-source project made by{' '}
        <a href="https://e2b.dev" target="_blank" className="text-[#ff8800]">
          ✶ E2B
        </a>
      </p>
    </form>
  )
}