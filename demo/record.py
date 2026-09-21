"""Records demo/deja.cast by driving a real shell through a pty.

asciinema needs a TTY it does not get in CI or from an agent, so the session is
scripted here instead: the same keystrokes, timed, written straight to asciicast v2.
"""

import fcntl
import json
import os
import pty
import select
import signal
import struct
import sys
import termios
import time

COLUMNS, ROWS = 96, 12
TYPING_DELAY = 0.05
DOWN = "\x1b[B"
UP = "\x1b[A"

STEPS = [
    ("wait", 1.2),
    ("type", "deja recipe"),
    ("wait", 2.6),
    ("key", DOWN),
    ("wait", 0.9),
    ("key", DOWN),
    ("wait", 0.9),
    ("key", UP),
    ("wait", 1.1),
    ("key", "\r"),
    ("wait", 3.5),
]


def main() -> int:
    home, target = sys.argv[1], sys.argv[2]
    child, master = pty.fork()

    if child == 0:
        os.environ.update(
            HOME=home,
            PATH=f"{home}/bin:{os.environ['PATH']}",
            TERM="xterm-256color",
            PS1="%F{green}❯%f ",
            PROMPT_EOL_MARK="",
        )
        os.execvp("zsh", ["zsh", "-f", "-i"])

    fcntl.ioctl(master, termios.TIOCSWINSZ, struct.pack("HHHH", ROWS, COLUMNS, 0, 0))

    started = time.time()
    events: list[list] = []

    def drain(seconds: float) -> None:
        deadline = time.time() + seconds
        while True:
            left = deadline - time.time()
            if left <= 0:
                return
            ready, _, _ = select.select([master], [], [], left)
            if not ready:
                continue
            try:
                chunk = os.read(master, 65536)
            except OSError:
                return
            if not chunk:
                return
            events.append([round(time.time() - started, 3), "o", chunk.decode("utf8", "replace")])

    os.write(master, b"clear\r")
    drain(1.0)
    started = time.time()
    events.clear()
    os.write(master, b"\r")
    drain(0.5)

    for action, value in STEPS:
        if action == "wait":
            drain(value)
        elif action == "key":
            os.write(master, value.encode())
            drain(0.1)
        else:
            drain(0.35)
            for char in value:
                os.write(master, char.encode())
                drain(TYPING_DELAY)
            drain(0.6)
            os.write(master, b"\r")
            drain(0.2)

    os.kill(child, signal.SIGTERM)

    header = {
        "version": 2,
        "width": COLUMNS,
        "height": ROWS,
        "timestamp": int(started),
        "env": {"SHELL": "/bin/zsh", "TERM": "xterm-256color"},
    }

    with open(target, "w", encoding="utf8") as cast:
        cast.write(json.dumps(header) + "\n")
        for event in events:
            cast.write(json.dumps(event) + "\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
