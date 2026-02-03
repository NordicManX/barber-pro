import { createClient } from '@/utils/supabase/server'
import { Clock, Scissors, Plus } from 'lucide-react' // Adicionei Plus aqui caso precise no card final
import Image from 'next/image'
import { NewServiceModal } from '@/components/NewServiceModal' // <--- IMPORTAR O MODAL
import { EditServiceModal } from '@/components/EditServiceModal'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export default async function ServicesPage() {
  const supabase = await createClient()

  // Buscar serviços
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3">
            <Scissors className="w-8 h-8 text-amber-500" />
            Serviços
          </h1>
          <p className="text-zinc-400 mt-2">
            Gerencie o catálogo de preços e tempos da barbearia.
          </p>
        </div>
        
        {/* AQUI ESTÁ A MÁGICA: TROCAMOS O BOTÃO PELO MODAL */}
        <NewServiceModal /> 
        
      </div>

      {/* Grid de Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {services?.map((service) => (
          <div key={service.id} className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-500/5">
            {/* ... Conteúdo do Card (Mantém igual ao anterior) ... */}
            <div className="h-32 bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                {service.image_url ? (
                    <Image src={service.image_url} alt={service.name} fill className="object-cover" />
                ) : (
                    <Scissors className="w-12 h-12 text-zinc-700 group-hover:text-amber-500 transition-colors" />
                )}
                
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-zinc-100 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
                    <Clock size={12} className="text-amber-500" />
                    {service.duration_minutes} min
                </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-zinc-100 group-hover:text-amber-500 transition-colors">
                    {service.name}
                </h3>
                <span className="text-lg font-bold text-zinc-100 bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-700">
                    {formatCurrency(service.price)}
                </span>
              </div>
              
              <p className="text-zinc-500 text-sm line-clamp-2 mb-4 h-10">
                {service.description || 'Sem descrição definida.'}
              </p>

              <EditServiceModal service={service} />
            </div>
          </div>
        ))}

        {/* Card Final de Atalho */}
        {/* Podemos remover ou transformar esse botão em um gatilho pro modal também no futuro */}
        <div className="border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-8 opacity-50">
             <span className="text-zinc-500 text-sm">Fim da lista</span>
        </div>

      </div>
    </div>
  )
}