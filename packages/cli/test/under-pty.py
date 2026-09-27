"""Run a command under a real pseudo-terminal, for e2e.mjs.

    python3 under-pty.py <command> [args...]

What the command writes comes out on stdout; what is written to stdin goes
to the command as if typed. The child's pid goes to stderr first
("pty-child <pid>"), so the test can stop its whole process group. Exits
with the command's exit code. It runs where it was started. Node has no pty
of its own, and init asks its questions only when stdin is a TTY.
"""

import fcntl
import os
import pty
import select
import struct
import sys
import termios

pid, fd = pty.fork()
if pid == 0:
    os.execvp(sys.argv[1], sys.argv[1:])

sys.stderr.write(f"pty-child {pid}\n")
sys.stderr.flush()
# 120 × 40, so no line the test waits for is wrapped.
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", 40, 120, 0, 0))

stdin, stdout = sys.stdin.fileno(), sys.stdout.fileno()
reading = True
while True:
    ready, _, _ = select.select([fd] + ([stdin] if reading else []), [], [])
    if fd in ready:
        try:
            data = os.read(fd, 4096)
        except OSError:  # the child has gone and the pty is closed
            break
        if not data:
            break
        os.write(stdout, data)
    if reading and stdin in ready:
        data = os.read(stdin, 4096)
        if data:
            os.write(fd, data)
        else:  # the test closed stdin; the child may still be running
            reading = False

_, status = os.waitpid(pid, 0)
sys.exit(os.waitstatus_to_exitcode(status))
