// Re-encodes a video's picture as H.264 at a target average bitrate, using only macOS frameworks.
//   swift reencode.swift <input> <output.mp4> <bits per second> [max width]
import AVFoundation
import Foundation

let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
let bitrate = Int(args[3])!
let maxWidth = args.count > 4 ? Double(args[4])! : 1920
let asset = AVURLAsset(url: input)
let finished = DispatchSemaphore(value: 0)

Task {
    do {
        let track = try await asset.loadTracks(withMediaType: .video)[0]
        let size = try await track.load(.naturalSize)
        let fps = try await track.load(.nominalFrameRate)
        let scale = min(1, maxWidth / size.width)
        let width = Int((size.width * scale / 2).rounded()) * 2, height = Int((size.height * scale / 2).rounded()) * 2
        let reader = try AVAssetReader(asset: asset)
        let frames = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange])
        reader.add(frames)
        try? FileManager.default.removeItem(at: output)
        let writer = try AVAssetWriter(outputURL: output, fileType: .mp4)
        writer.shouldOptimizeForNetworkUse = true // index first, so browsers can start before the whole file arrives
        let encoder = AVAssetWriterInput(mediaType: .video, outputSettings: [
            AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: width, AVVideoHeightKey: height,
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: bitrate, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                AVVideoH264EntropyModeKey: AVVideoH264EntropyModeCABAC, AVVideoMaxKeyFrameIntervalKey: Int(fps * 2), AVVideoExpectedSourceFrameRateKey: Int(fps),
            ],
        ])
        encoder.expectsMediaDataInRealTime = false
        writer.add(encoder)
        guard reader.startReading(), writer.startWriting() else { throw reader.error ?? writer.error ?? NSError(domain: "reencode", code: 1) }
        writer.startSession(atSourceTime: .zero)
        while let sample = frames.copyNextSampleBuffer() {
            while !encoder.isReadyForMoreMediaData { try await Task.sleep(nanoseconds: 2_000_000) }
            encoder.append(sample)
        }
        encoder.markAsFinished()
        await writer.finishWriting()
        print("\(output.lastPathComponent): \(width)x\(height) \(fps)fps status=\(writer.status.rawValue) \(writer.error?.localizedDescription ?? "ok")")
        finished.signal()
    } catch { print("error: \(error)"); finished.signal() }
}
finished.wait()
