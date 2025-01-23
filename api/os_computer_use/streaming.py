from e2b_desktop import Sandbox as SandboxBase
import asyncio
import os
import signal


class Sandbox(SandboxBase):

    def start_stream(self):
        command = (
            "ffmpeg -video_size 1024x768 -f x11grab -i :99 -c:v libx264 -c:a aac -g 50 "
            "-b:v 4000k -maxrate 4000k -bufsize 8000k -f flv rtmp://global-live.mux.com:5222/app/$STREAM_KEY"
        )
        self.commands.run(
            command,
            background=True,
            envs={"STREAM_KEY": os.getenv("STREAM_KEY")},
        )

    def kill(self):
        if hasattr(self, "process"):
            self.process.kill()
        super().kill()
