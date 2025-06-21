// src/utils/qrUtils.js
import QRCode from 'qrcode';

export class QRUtils {
  // QR 코드 생성 (Base64 이미지 반환)
  static async generateQRCode(data, options = {}) {
    try {
      const defaultOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      };

      const qrOptions = { ...defaultOptions, ...options };
      const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions);
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('QR 코드 생성 오류:', error);
      throw new Error('QR 코드 생성에 실패했습니다.');
    }
  }

  // 고객용 QR 코드 URL 생성 (NEW!)
  static generateCustomerURL(gifticonId) {
    // 실제 배포 시에는 도메인을 변경해야 합니다
    const baseURL = window.location.origin;
    return `${baseURL}/check/${gifticonId}`;
  }

  // QR 코드 캔버스에 그리기
  static async generateQRToCanvas(canvasElement, data, options = {}) {
    try {
      const defaultOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      };

      const qrOptions = { ...defaultOptions, ...options };
      await QRCode.toCanvas(canvasElement, data, qrOptions);
      
      return true;
    } catch (error) {
      console.error('QR 코드 캔버스 생성 오류:', error);
      throw new Error('QR 코드 생성에 실패했습니다.');
    }
  }

  // QR 코드 다운로드용 링크 생성
  static createDownloadLink(qrCodeDataURL, filename = 'gifticon-qr.png') {
    const link = document.createElement('a');
    link.href = qrCodeDataURL;
    link.download = filename;
    return link;
  }

  // QR 코드 프린트용 창 열기
  static printQRCode(qrCodeDataURL, gifticonInfo = {}) {
    const printWindow = window.open('', '_blank');
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>기프티콘 QR 코드</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              border: 2px solid #333;
              border-radius: 10px;
              padding: 20px;
              margin: 20px auto;
              max-width: 400px;
              background: white;
            }
            .qr-code {
              margin: 20px 0;
            }
            .info {
              margin: 10px 0;
              font-size: 14px;
            }
            .amount {
              font-size: 24px;
              font-weight: bold;
              color: #27ae60;
              margin: 15px 0;
            }
            .id {
              font-family: monospace;
              background: #f5f5f5;
              padding: 5px;
              border-radius: 4px;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 1px solid #333; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>🎁 요거트퍼플 기프티콘</h2>
            <div class="qr-code">
              <img src="${qrCodeDataURL}" alt="QR Code" />
            </div>
            ${gifticonInfo.amount ? `<div class="amount">${new Intl.NumberFormat('ko-KR').format(gifticonInfo.amount)}원</div>` : ''}
            ${gifticonInfo.id ? `<div class="info">기프티콘 번호: <span class="id">${gifticonInfo.id}</span></div>` : ''}
            ${gifticonInfo.purchaserName ? `<div class="info">구매자: ${gifticonInfo.purchaserName}</div>` : ''}
            ${gifticonInfo.expiresAt ? `<div class="info">유효기간: ${new Date(gifticonInfo.expiresAt).toLocaleDateString('ko-KR')}</div>` : ''}
            <div class="info">📱 매장에서 QR 코드를 스캔하여 사용하세요</div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    // 이미지 로드 후 프린트 실행
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 100);
    };
  }
}