import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    const disposable = vscode.commands.registerCommand('agent3d.openOffice', () => {
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.Beside);
            return;
        }

        currentPanel = vscode.window.createWebviewPanel(
            'agent3dOffice',
            '3D Ajan Takımı',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        currentPanel.webview.html = getWebviewContent();

        // 3D sahneden gelen tıklama ve soru sorma mesajlarını yakala
        currentPanel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'askAgent') {
                    const agentName: string = message.agent; // 'tester', 'reviewer', 'fixer'
                    
                    // Kullanıcıdan hızlı soru al (boş bırakılırsa doğrudan chat açılır)
                    const userPrompt = await vscode.window.showInputBox({
                        prompt: `${agentName.toUpperCase()} ajanına ne sormak veya yaptırmak istiyorsun?`,
                        placeHolder: `Örn: Son değişiklikleri kontrol et...`
                    });

                    if (userPrompt !== undefined) {
                        // VS Code Copilot Chat panelini seçilen ajan moduyla aç
                        await vscode.commands.executeCommand('workbench.action.chat.open', {
                            query: userPrompt || `@${agentName} Mevcut durumu raporla.`
                        });
                    }
                }
            },
            undefined,
            context.subscriptions
        );

        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        }, null, context.subscriptions);
    });

    // CANLI İZLEME 1: Terminalde test çalıştığında TESTER ajanını aktifleştir
    const terminalListener = vscode.window.onDidStartTerminalShellExecution((e) => {
        currentPanel?.webview.postMessage({
            type: 'agentState',
            agent: 'tester',
            status: 'working',
            task: `Test çalıştırılıyor: ${e.execution.commandLine.value}`
        });
    });

    const terminalEndListener = vscode.window.onDidEndTerminalShellExecution((e) => {
        const isError = e.exitCode !== undefined && e.exitCode !== 0;
        currentPanel?.webview.postMessage({
            type: 'agentState',
            agent: 'tester',
            status: isError ? 'error' : 'idle',
            task: isError ? 'Hata tespit edildi!' : 'Test tamamlandı.'
        });
    });

    // CANLI İZLEME 2: Dosya değiştiğinde FIXER ve ardından REVIEWER ajanını aktifleştir
    const docChangeListener = vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.uri.scheme !== 'file') return;

        currentPanel?.webview.postMessage({
            type: 'agentState',
            agent: 'fixer',
            status: 'working',
            task: `Düzenlendi: ${doc.fileName.split(/[\\/]/).pop()}`
        });

        // 2.5 saniye sonra Reviewer denetime geçsin
        setTimeout(() => {
            currentPanel?.webview.postMessage({
                type: 'agentState',
                agent: 'fixer',
                status: 'idle',
                task: 'Hazır'
            });
            currentPanel?.webview.postMessage({
                type: 'agentState',
                agent: 'reviewer',
                status: 'working',
                task: 'Kod kalitesi denetleniyor...'
            });

            setTimeout(() => {
                currentPanel?.webview.postMessage({
                    type: 'agentState',
                    agent: 'reviewer',
                    status: 'idle',
                    task: 'Denetim tamamlandı.'
                });
            }, 3000);
        }, 2500);
    });

    context.subscriptions.push(disposable, terminalListener, terminalEndListener, docChangeListener);
}

function getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Ajan Takımı</title>
    <style>
        body { margin: 0; overflow: hidden; background: #121218; font-family: 'Segoe UI', sans-serif; color: #fff; }
        #hud {
            position: absolute; top: 12px; left: 12px; right: 12px;
            display: flex; justify-content: space-between; pointer-events: none;
        }
        .card {
            background: rgba(25, 27, 38, 0.85); border: 1px solid #33384d;
            border-radius: 8px; padding: 10px 14px; width: 30%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .card h3 { margin: 0 0 4px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .card p { margin: 0; font-size: 11px; color: #a0a8c0; }
        .badge { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; background: #4caf50; }
        #hint {
            position: absolute; bottom: 14px; width: 100%; text-align: center;
            font-size: 12px; color: #8c96b0; pointer-events: none;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <div id="hud">
        <div class="card" id="card-tester">
            <h3><span class="badge" id="dot-tester"></span>Tester</h3>
            <p id="task-tester">Beklemede (Tıkla &amp; Sor)</p>
        </div>
        <div class="card" id="card-reviewer">
            <h3><span class="badge" id="dot-reviewer"></span>Reviewer</h3>
            <p id="task-reviewer">Beklemede (Tıkla &amp; Sor)</p>
        </div>
        <div class="card" id="card-fixer">
            <h3><span class="badge" id="dot-fixer"></span>Fixer</h3>
            <p id="task-fixer">Beklemede (Tıkla &amp; Sor)</p>
        </div>
    </div>
    <div id="hint">Bir ajana soru sormak için 3D karakterin üzerine tıkla</div>

    <script>
        const vscode = acquireVsCodeApi();

        // Sahne, Kamera ve Renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x121218);
        scene.fog = new THREE.Fog(0x121218, 10, 25);

        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.set(0, 5.5, 9.5);
        camera.lookAt(0, 0.8, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        // Işıklar
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        scene.add(dirLight);

        // Zemin Izgarası
        const grid = new THREE.GridHelper(16, 16, 0x2d334a, 0x1e2233);
        scene.add(grid);

        // 3 Ajan İstasyonu Oluşturucu
        const agents = {};
        const clickableMeshes = [];

        function createAgentStation(id, xPos, colorHex) {
            const group = new THREE.Group();
            group.position.set(xPos, 0, 0);

            // Masa
            const deskGeo = new THREE.BoxGeometry(2.2, 0.12, 1.2);
            const deskMat = new THREE.MeshStandardMaterial({ color: 0x262a3a, roughness: 0.5 });
            const desk = new THREE.Mesh(deskGeo, deskMat);
            desk.position.set(0, 0.8, 0.5);
            group.add(desk);

            // Monitör
            const monitorGeo = new THREE.BoxGeometry(1.1, 0.65, 0.08);
            const monitorMat = new THREE.MeshStandardMaterial({ color: 0x0d0f14, emissive: colorHex, emissiveIntensity: 0.25 });
            const monitor = new THREE.Mesh(monitorGeo, monitorMat);
            monitor.position.set(0, 1.25, 0.45);
            group.add(monitor);

            // Ajan Gövde (Tıklanabilir Mesh)
            const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.1, 16);
            const bodyMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.3 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.set(0, 0.9, -0.3);
            body.userData = { agentId: id };
            group.add(body);
            clickableMeshes.push(body);

            // Ajan Kafa (Tıklanabilir Mesh)
            const headGeo = new THREE.SphereGeometry(0.32, 20, 20);
            const headMat = new THREE.MeshStandardMaterial({ color: 0xf2d2bd, roughness: 0.4 });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.set(0, 1.7, -0.3);
            head.userData = { agentId: id };
            group.add(head);
            clickableMeshes.push(head);

            // Durum Halkası (Kafa üstü)
            const ringGeo = new THREE.TorusGeometry(0.28, 0.04, 12, 24);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x4caf50 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(0, 2.2, -0.3);
            group.add(ring);

            scene.add(group);
            agents[id] = { group, body, head, ring, monitor, status: 'idle', baseColor: colorHex };
        }

        createAgentStation('tester', -3.2, 0x3b82f6);   // Mavi: Tester
        createAgentStation('reviewer', 0, 0xa855f7);     // Mor: Reviewer
        createAgentStation('fixer', 3.2, 0xf97316);      // Turuncu: Fixer

        // Raycaster (Tıklama ve Hover Algılama)
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(clickableMeshes);
            document.body.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
        });

        window.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(clickableMeshes);

            if (intersects.length > 0) {
                const clickedAgent = intersects[0].object.userData.agentId;
                vscode.postMessage({ command: 'askAgent', agent: clickedAgent });
            }
        });

        // VS Code'dan Gelen Durum Güncellemelerini Dinle
        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (msg.type === 'agentState') {
                const ag = agents[msg.agent];
                if (!ag) return;
                ag.status = msg.status;

                const dot = document.getElementById('dot-' + msg.agent);
                const taskText = document.getElementById('task-' + msg.agent);
                taskText.innerText = msg.task;

                if (msg.status === 'working') {
                    ag.ring.material.color.setHex(0xffeb3b);
                    ag.monitor.material.emissiveIntensity = 0.9;
                    dot.style.background = '#ffeb3b';
                } else if (msg.status === 'error') {
                    ag.ring.material.color.setHex(0xf44336);
                    ag.monitor.material.emissiveIntensity = 0.9;
                    dot.style.background = '#f44336';
                } else {
                    ag.ring.material.color.setHex(0x4caf50);
                    ag.monitor.material.emissiveIntensity = 0.25;
                    dot.style.background = '#4caf50';
                }
            }
        });

        // Canlı Animasyon Döngüsü
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            Object.values(agents).forEach((ag, idx) => {
                if (ag.status === 'working') {
                    // Çalışırken hızlı zıplama ve kafa sallama animasyonu
                    ag.body.position.y = 0.9 + Math.abs(Math.sin(t * 8 + idx)) * 0.15;
                    ag.head.position.y = 1.7 + Math.abs(Math.sin(t * 8 + idx)) * 0.18;
                    ag.head.rotation.z = Math.sin(t * 10) * 0.15;
                    ag.ring.rotation.z += 0.08;
                } else {
                    // Beklemede hafif nefes alma hareketi
                    ag.body.position.y = 0.9 + Math.sin(t * 2 + idx) * 0.03;
                    ag.head.position.y = 1.7 + Math.sin(t * 2 + idx) * 0.03;
                    ag.head.rotation.z = 0;
                    ag.ring.rotation.z += 0.01;
                }
            });

            renderer.render(scene, camera);
        }
        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>`;
}

export function deactivate() {}