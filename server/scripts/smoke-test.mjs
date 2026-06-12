const baseUrl = process.env.API_BASE_URL || "http://localhost:3001";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...options.headers,
    },
  });
  const body = await response.json();
  return { status: response.status, body };
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

const profile = await request("/api/profiles", {
  method: "POST",
  body: JSON.stringify({
    careerDirection: "技术路线",
    priority: "稳定就业",
    longTermStudy: "可以接受",
    cityPreference: "省会城市也可以",
    riskPreference: "稳妥优先",
    province: "河南",
    subjectType: "物理类",
    score: "586",
    rank: "32500",
  }),
});
expect(profile.status === 201, "profile creation failed");

const free = await request("/api/reports/free", {
  method: "POST",
  body: JSON.stringify({ profileId: profile.body.profileId }),
});
expect(free.status === 201, "free report generation failed");

const order = await request("/api/orders", {
  method: "POST",
  body: JSON.stringify({
    profileId: profile.body.profileId,
    reportId: free.body.reportId,
    amount: 1990,
  }),
});
expect(order.status === 201, "order creation failed");

const unpaidFull = await request("/api/reports/full", {
  method: "POST",
  body: JSON.stringify({ reportId: free.body.reportId }),
});
expect(unpaidFull.status === 403, "unpaid full report was not blocked");

const unpaidChat = await request("/api/chat/session", {
  method: "POST",
  body: JSON.stringify({ reportId: free.body.reportId }),
});
expect(unpaidChat.status === 403, "unpaid chat was not blocked");

const paid = await request(`/api/dev/orders/${order.body.orderId}/mark-paid`, {
  method: "POST",
});
expect(paid.status === 200, "mark-paid failed");

const full = await request("/api/reports/full", {
  method: "POST",
  body: JSON.stringify({ reportId: free.body.reportId }),
});
expect(full.status === 200, "paid full report generation failed");

const session = await request("/api/chat/session", {
  method: "POST",
  body: JSON.stringify({ reportId: free.body.reportId }),
});
expect(session.status === 201, "chat session creation failed");
expect(session.body.messageLimit === 20, "chat limit should be 20");

let lastReply;
for (let index = 1; index <= 20; index += 1) {
  lastReply = await request("/api/chat/message", {
    method: "POST",
    body: JSON.stringify({
      chatSessionId: session.body.chatSessionId,
      message: `第 ${index} 次测试：如何继续核对专业风险？`,
    }),
  });
  expect(lastReply.status === 200, `chat message ${index} failed`);
}
expect(lastReply.body.remainingMessages === 0, "remaining messages should be zero");

const exceeded = await request("/api/chat/message", {
  method: "POST",
  body: JSON.stringify({
    chatSessionId: session.body.chatSessionId,
    message: "第 21 次测试",
  }),
});
expect(exceeded.status === 403, "the 21st chat message was not blocked");
expect(
  exceeded.body.error?.code === "CHAT_LIMIT_EXCEEDED",
  "unexpected limit error code",
);

const history = await request(
  `/api/chat/session/${session.body.chatSessionId}/messages`,
);
expect(history.status === 200, "chat history failed");
expect(history.body.messages.length === 40, "chat history should contain 40 messages");

console.log(
  JSON.stringify(
    {
      status: "passed",
      profileId: profile.body.profileId,
      reportId: free.body.reportId,
      orderId: order.body.orderId,
      chatSessionId: session.body.chatSessionId,
      assertions: {
        unpaidFullReportBlocked: true,
        unpaidChatBlocked: true,
        paidFullReportGenerated: true,
        twentyQuestionsAllowed: true,
        twentyFirstQuestionBlocked: true,
        historySaved: true,
      },
    },
    null,
    2,
  ),
);
