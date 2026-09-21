import { Mascot } from 'page-mascot'
import { chatMessages } from '../../mocks/memberData'

export function AiAssistant() {
  return (
    <section className="screen">
      <div className="screen-heading">
        <div>
          <span className="eyebrow">AI Assistant</span>
          <h1>Trợ lý tập luyện của bạn</h1>
        </div>
      </div>

      <div className="assistant-layout">
        <article className="panel chat-panel">
          <div className="panel-header">
            <h2>Chat với AI</h2>
            <span>Hỗ trợ tập luyện và thông tin Center</span>
          </div>
          <div className="chat-thread">
            {chatMessages.map((message, index) => (
              <div className={`message ${message.sender}`} key={`${message.sender}-${index}`}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <span>Nhập câu hỏi về bài tập, lịch hoặc chính sách...</span>
            <button className="send-button" type="button" aria-label="Gửi tin nhắn">
              Gửi
            </button>
          </div>
        </article>

        <aside className="panel">
          <div className="assistant-mascot">
            <Mascot
              directions="/mascots/crt-directions.webp"
              reactions="/mascots/crt-reactions.webp"
              size={150}
              label="AI Wellness Coach mascot"
            />
            <div>
              <strong>AI Wellness Coach</strong>
              <span>Luôn sẵn sàng hỗ trợ bài tập, lịch và chính sách Center.</span>
            </div>
          </div>

          <div className="panel-header">
            <h2>Gợi ý nhanh</h2>
            <span>Dựa trên hồ sơ hiện tại</span>
          </div>
          <div className="suggestion-list">
            <button type="button">Tư vấn phục hồi sau buổi tập</button>
            <button type="button">Gợi ý dinh dưỡng trước khi tập</button>
            <button type="button">Kiểm tra lịch hoạt động Center</button>
          </div>
        </aside>
      </div>
    </section>
  )
}
