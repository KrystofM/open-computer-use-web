import mux_python
from e2b_desktop import Sandbox as SandboxBase
import asyncio
import os
import signal
from mux_python import Configuration


class Sandbox(SandboxBase):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        configuration = mux_python.Configuration()
        configuration.username = os.environ["MUX_TOKEN_ID"]
        configuration.password = os.environ["MUX_TOKEN_SECRET"]
        self.live_api = mux_python.LiveStreamsApi(mux_python.ApiClient(configuration))
        self.playback_id = None

    def create_stream(self):
        new_asset_settings = mux_python.CreateAssetRequest(
            playback_policy=[mux_python.PlaybackPolicy.PUBLIC]
        )
        create_live_stream_request = mux_python.CreateLiveStreamRequest(
            playback_policy=[mux_python.PlaybackPolicy.PUBLIC],
            new_asset_settings=new_asset_settings,
        )
        create_live_stream_response = self.live_api.create_live_stream(
            create_live_stream_request
        )
        return create_live_stream_response

    async def wait_for_stream_active(self, stream_key):
        while True:
            stream = self.live_api.get_live_stream(stream_key)
            if stream.data.status == "active":
                return stream
            await asyncio.sleep(1)

    async def start_stream(self):
        response = self.create_stream()

        command = (
            "ffmpeg -video_size 1024x768 -f x11grab -i :99 -c:v libx264 -c:a aac -g 50 "
            "-b:v 4000k -maxrate 4000k -bufsize 8000k -f flv rtmp://global-live.mux.com:5222/app/$STREAM_KEY"
        )
        self.commands.run(
            command,
            background=True,
            envs={"STREAM_KEY": response.data.stream_key},
        )

        await self.wait_for_stream_active(response.data.id)
        self.playback_id = response.data.playback_ids[0].id
        return self.playback_id

    def is_stream_active(self):
        return self.playback_id is not None

    def kill(self):
        if hasattr(self, "process"):
            self.process.kill()
        super().kill()
