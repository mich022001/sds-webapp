import cookie from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  res.setHeader(
    "Set-Cookie",
    cookie.serialize("sds_session", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    })
  );

  return res.status(200).json({ ok: true });
}
