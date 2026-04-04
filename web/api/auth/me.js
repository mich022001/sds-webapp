import jwt from "jsonwebtoken";
import cookie from "cookie";

export default async function handler(req, res) {
  try {
    const secret = process.env.SDS_AUTH_SECRET;
    if (!secret) {
      throw new Error("Missing SDS_AUTH_SECRET");
    }

    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.sds_session;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = jwt.verify(token, secret);

    return res.status(200).json({
      user: {
        id: payload.sub,
        username: payload.username,
        full_name: payload.full_name,
        role: payload.role,
      },
    });
  } catch {
    return res.status(401).json({ error: "Not authenticated" });
  }
}
