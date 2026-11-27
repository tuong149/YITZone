package vn.edu.fit.yitzone.common.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import vn.edu.fit.yitzone.common.api.ErrorCode;
import vn.edu.fit.yitzone.common.exception.BusinessException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

/**
 * ClamAV TCP INSTREAM virus scanner hook (HLD 5.3).
 * Disabled safely on lightweight dev environments when yitzone.clamav.enabled=false.
 */
@Service
public class ClamAvScannerService {
    private static final Logger log = LoggerFactory.getLogger(ClamAvScannerService.class);
    private static final int CHUNK_SIZE = 8192;

    private final boolean enabled;
    private final String host;
    private final int port;

    public ClamAvScannerService(
            @Value("${yitzone.clamav.enabled:false}") boolean enabled,
            @Value("${yitzone.clamav.host:localhost}") String host,
            @Value("${yitzone.clamav.port:3310}") int port
    ) {
        this.enabled = enabled;
        this.host = host;
        this.port = port;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void scanOrThrow(byte[] content, String fileName) {
        if (!enabled) {
            return;
        }
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 3000);
            socket.setSoTimeout(10_000);
            OutputStream out = socket.getOutputStream();
            out.write("zINSTREAM\0".getBytes(StandardCharsets.US_ASCII));

            int offset = 0;
            while (offset < content.length) {
                int len = Math.min(CHUNK_SIZE, content.length - offset);
                out.write(ByteBuffer.allocate(4).putInt(len).array());
                out.write(content, offset, len);
                offset += len;
            }
            out.write(new byte[]{0, 0, 0, 0});
            out.flush();

            String reply = readReply(socket.getInputStream());
            if (!reply.endsWith("OK")) {
                log.warn("ClamAV rejected uploaded file '{}': {}", fileName, reply);
                throw new BusinessException(
                        ErrorCode.BAD_REQUEST,
                        HttpStatus.BAD_REQUEST,
                        "Tệp tải lên không vượt qua kiểm tra an toàn mã độc (ClamAV): " + reply
                );
            }
        } catch (BusinessException ex) {
            throw ex;
        } catch (IOException ex) {
            log.error("ClamAV daemon unreachable at {}:{}: {}", host, port, ex.getMessage());
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Dịch vụ quét mã độc (ClamAV) tạm thời không sẵn sàng, vui lòng thử lại sau"
            );
        }
    }

    private String readReply(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] tmp = new byte[256];
        int n;
        while ((n = in.read(tmp)) != -1) {
            buffer.write(tmp, 0, n);
        }
        return buffer.toString(StandardCharsets.UTF_8).replace("\0", "").trim();
    }
}
