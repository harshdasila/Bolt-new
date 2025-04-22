import { WebContainer } from '@webcontainer/api';
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("Preparing environment...");

  async function main() {
    try {
      // Set status to inform user
      setStatus("Installing dependencies...");
      
      // Start the npm install process
      const installProcess = await webContainer.spawn('npm', ['install']);
      
      // Set up the output handling
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log(data);
          // Optionally update status with latest output
          setStatus(`Installing: ${data}`);
        }
      }));
      
      // Wait for the install process to complete
      const installExitCode = await installProcess.exit;
      
      // Check if installation was successful
      if (installExitCode !== 0) {
        setStatus("Installation failed with code " + installExitCode);
        return;
      }
      
      // Update status
      setStatus("Starting development server...");
      
      // Only now run the dev command
      const devProcess = await webContainer.spawn('npm', ['run', 'dev']);
      
      // Set up output handling for dev process
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          console.log(data);
        }
      }));
      
      // Listen for the server-ready event
      webContainer.on('server-ready', (port, url) => {
        console.log(url, 'url');
        console.log(port);
        setStatus("Server running!");
        setUrl(url);
      });
      
    } catch (error: any) {
      console.error("Error in webcontainer execution:", error);
      setStatus(`Error: ${error.message}`);
    }
  }

  useEffect(() => {
    main();
    // Include webContainer in the dependency array
  }, [webContainer]);

  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url && (
        <div className="text-center">
          <p className="mb-2">{status}</p>
        </div>
      )}
      {url && <iframe width={"100%"} height={"100%"} src={url} />}
    </div>
  );
}