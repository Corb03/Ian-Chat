from flask import Flask, render_template, request, redirect
from bs4 import BeautifulSoup
import os

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
HTML_FILENAME = None

@app.route("/")
def home():
    if not HTML_FILENAME:
        return render_template(
            "viewer.html",
            messages=[],
            html_filename="No Channel Selected"
        )

    file_path = os.path.join(UPLOAD_FOLDER, HTML_FILENAME)

    if not os.path.exists(file_path):
        return render_template(
            "viewer.html",
            messages=[],
            html_filename="File not found"
        )

    with open(file_path, encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")

    messages = []
    for msg in soup.select(".chatlog__message-container"):
        username = msg.select_one(".chatlog__author")
        timestamp = msg.select_one(".chatlog__timestamp a")
        content = msg.select_one(".chatlog__content")
        avatar = msg.select_one(".chatlog__avatar")

        messages.append({
            "username": username.text.strip() if username else "Unknown",
            "timestamp": timestamp.text.strip() if timestamp else "",
            "content": content.decode_contents() if content else "",
            "avatar": avatar["src"] if avatar and avatar.has_attr("src") else ""
        })

    return render_template(
        "viewer.html",
        messages=messages,
        html_filename=HTML_FILENAME
    )


@app.route("/switch", methods=["POST"])
def switch():
    global HTML_FILENAME

    if "html_file" not in request.files:
        return "No file uploaded", 400

    file = request.files["html_file"]

    if file.filename == "":
        return "No selected file", 400

    if not file.filename.lower().endswith(".html"):
        return "Only .html files allowed", 400

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    HTML_FILENAME = file.filename
    return redirect("/")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port
