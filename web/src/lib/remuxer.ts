let ffmpeg: any;

export async function remux(
  videoBlob: Blob, 
  audioBlob: Blob, 
  onStep?: (step: string) => void
): Promise<Blob> {
  console.log('🎬 [Remux] 开始视频合并处理');
  console.log('📊 [Remux] 输入文件信息:', {
    videoSize: `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`,
    audioSize: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`,
    videoType: videoBlob.type,
    audioType: audioBlob.type
  });

  try {
    if (!ffmpeg) {
      onStep?.('正在初始化视频处理引擎...');
      console.log('⚙️ [Remux] 首次使用，初始化FFmpeg...');
      try {
        // 动态导入，新版本API
        const { FFmpeg } = await import('@ffmpeg/ffmpeg') as any;
        console.log('📦 [Remux] FFmpeg模块导入成功，创建实例...');
        ffmpeg = new FFmpeg();
        
        // 添加日志处理器
        ffmpeg.on('log', ({ message }: any) => {
          console.log('[FFmpeg]', message);
        });
        
        // 添加进度处理器
        ffmpeg.on('progress', ({ progress }: any) => {
          console.log(`[FFmpeg Progress] ${(progress * 100).toFixed(1)}%`);
        });
        
        onStep?.('正在加载视频处理核心...');
        console.log('📦 [Remux] FFmpeg实例创建完成，开始加载核心...');
        // 先尝试无参数加载（使用默认路径）
        try {
          await ffmpeg.load();
          console.log('✅ [Remux] FFmpeg核心加载完成（默认路径）');
        } catch (loadError) {
          console.log('🔄 [Remux] 默认加载失败，尝试指定核心路径...');
          // 备选：使用CDN路径
          await ffmpeg.load({
            coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
            wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm',
            workerURL: 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.worker.js'
          });
          console.log('✅ [Remux] FFmpeg核心加载完成（CDN路径）');
        }
      } catch (importError) {
        console.error('❌ [Remux] FFmpeg导入失败:', importError);
        // 尝试旧版本API作为备选
        console.log('🔄 [Remux] 尝试旧版本API...');
        const ffmpegModule = await import('@ffmpeg/ffmpeg') as any;
        if (ffmpegModule.createFFmpeg) {
          ffmpeg = ffmpegModule.createFFmpeg({ log: true });
        } else if (ffmpegModule.FFmpeg) {
          ffmpeg = new ffmpegModule.FFmpeg();
        } else {
          throw new Error('无法找到合适的FFmpeg构造函数');
        }
        await ffmpeg.load();
      }
    }

    onStep?.('正在准备视频文件...');
    console.log('📝 [Remux] 写入视频文件到FFmpeg文件系统...');
    
    // 检查文件大小
    console.log('📊 [Remux] 文件大小检查:', {
      videoSize: `${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`,
      audioSize: `${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`,
      totalSize: `${((videoBlob.size + audioBlob.size) / 1024 / 1024).toFixed(2)} MB`
    });
    
    // 检查可用内存
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      console.log('💾 [Remux] 内存状态:', {
        used: `${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
    
    // 新版本API: 使用 writeFile 而不是 FS('writeFile')
    await ffmpeg.writeFile('video.m4s', await new Promise<Uint8Array>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(videoBlob);
    }));
    
    onStep?.('正在准备音频文件...');
    console.log('📝 [Remux] 写入音频文件到FFmpeg文件系统...');
    await ffmpeg.writeFile('audio.m4s', await new Promise<Uint8Array>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(audioBlob);
    }));

    onStep?.('正在合并音视频，请稍候...');
    console.log('🔄 [Remux] 开始执行FFmpeg合并命令...');
    console.log('⏳ [Remux] 这可能需要一些时间，请耐心等待...');
    
    try {
      // 使用更兼容的参数进行合并
      await ffmpeg.exec([
        '-i', 'video.m4s',
        '-i', 'audio.m4s',
        '-c:v', 'copy',          // 明确指定视频编解码器
        '-c:a', 'copy',          // 明确指定音频编解码器
        '-movflags', 'faststart', // 优化 MP4 格式
        '-avoid_negative_ts', 'make_zero', // 避免时间戳问题
        '-fflags', '+genpts',    // 生成时间戳
        'output.mp4'
      ]);
      console.log('✅ [Remux] FFmpeg命令执行完成');
    } catch (ffmpegError) {
      console.error('❌ [Remux] FFmpeg执行失败，尝试备用参数...');
      console.error('FFmpeg错误详情:', ffmpegError);
      
      // 备用方案：使用更简单的参数
      await ffmpeg.exec([
        '-i', 'video.m4s',
        '-i', 'audio.m4s',
        '-c', 'copy',
        '-shortest',              // 以最短流为准
        'output.mp4'
      ]);
      console.log('✅ [Remux] 备用方案执行完成');
    }

    console.log('📤 [Remux] 读取合并后的文件...');
    const data = await ffmpeg.readFile('output.mp4');
    
    console.log('🧹 [Remux] 清理临时文件...');
    // 清理
    await ffmpeg.deleteFile('video.m4s');
    await ffmpeg.deleteFile('audio.m4s');
    await ffmpeg.deleteFile('output.mp4');

    // 新版本API返回的数据格式处理
    const resultBlob = new Blob([data], { type: 'video/mp4' });
    console.log('✅ [Remux] 视频合并完成', {
      outputSize: `${(resultBlob.size / 1024 / 1024).toFixed(2)} MB`
    });
    
    return resultBlob;
    
  } catch (error) {
    console.error('❌ [Remux] 视频合并失败:', error);
    throw error;
  }
} 